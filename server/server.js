import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
dotenv.config();
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}
import { neon } from '@neondatabase/serverless';
import { 
  verifyPassword, 
  hashPassword, 
  createJwtToken, 
  checkLoginRateLimit, 
  recordFailedLogin, 
  clearFailedLogin,
  requireAdminMiddleware,
  verifyJwtToken,
  getInitialAdminCredentials,
  issueSseTicket,
  consumeSseTicket
} from './auth.js';
import {
  notifyServerError,
  notifyServerWarning,
  notifyServerStartup,
  testDeveloperServerAlert,
  escapeTelegramHtml
} from './monitoringBot.js';

// ----------------------------------------------------
// GLOBAL PROCESS EXCEPTION MONITORING (TELEGRAM BOT ALERT)
// ----------------------------------------------------
process.on('uncaughtException', async (error) => {
  console.error('💥 [Server Process] Uncaught Exception:', error);
  try {
    await notifyServerError(error, { location: 'process.uncaughtException', critical: true });
  } catch (e) {}
});

process.on('unhandledRejection', async (reason) => {
  console.error('💥 [Server Process] Unhandled Rejection:', reason);
  try {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    await notifyServerError(err, { location: 'process.unhandledRejection' });
  } catch (e) {}
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Chạy sau Nginx: req.ip lấy IP thật từ proxy, không tin header X-Forwarded-For do client tự đặt
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// Middleware
// CORS: chỉ cho phép origin nằm trong ALLOWED_ORIGINS (phân tách bằng dấu phẩy). Frontend chạy cùng origin
// qua Nginx nên không cần CORS; request không có header Origin (curl, server-to-server) luôn được qua.
// Ngoài production, tự cho phép localhost để chạy dev.
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean)
);
const isLocalDevOrigin = (origin) =>
  process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || isLocalDevOrigin(origin)) return callback(null, true);
    return callback(null, false); // không gửi header CORS -> trình duyệt chặn
  }
}));

// Body parser: giới hạn lớn (ảnh sản phẩm/ảnh hoa dạng data URI) CHỈ dành cho admin đã đăng nhập;
// khách vãng lai bị giới hạn nhỏ để không thể làm cạn RAM bằng body khổng lồ. rawBody giữ lại để
// xác thực chữ ký webhook Facebook.
const captureRawBody = (req, _res, buf) => { req.rawBody = buf; };
const adminJsonParser = express.json({ limit: '25mb', verify: captureRawBody });
const guestJsonParser = express.json({ limit: '3mb', verify: captureRawBody });
const adminUrlencodedParser = express.urlencoded({ extended: true, limit: '25mb' });
const guestUrlencodedParser = express.urlencoded({ extended: true, limit: '100kb' });
const isAdminRequest = (req) => {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') && Boolean(verifyJwtToken(h.slice(7).trim()));
};
app.use((req, res, next) => (isAdminRequest(req) ? adminJsonParser : guestJsonParser)(req, res, next));
app.use((req, res, next) => (isAdminRequest(req) ? adminUrlencodedParser : guestUrlencodedParser)(req, res, next));

// Rate limiter đơn giản trong bộ nhớ theo IP (Nginx đã đặt trust proxy = 1 nên req.ip là IP thật)
const createRateLimiter = ({ windowMs, max, message, skip = () => false }) => {
  const hits = new Map(); // ip -> { count, resetAt }
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [ip, r] of hits) if (r.resetAt <= now) hits.delete(ip);
  }, windowMs);
  sweep.unref?.();
  return (req, res, next) => {
    if (skip(req)) return next();
    const now = Date.now();
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    let rec = hits.get(ip);
    if (!rec || rec.resetAt <= now) {
      rec = { count: 0, resetAt: now + windowMs };
      hits.set(ip, rec);
    }
    rec.count += 1;
    if (rec.count > max) {
      res.setHeader('Retry-After', Math.ceil((rec.resetAt - now) / 1000));
      return res.status(429).json({ success: false, message });
    }
    next();
  };
};
const orderCreateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, max: 10, skip: isAdminRequest,
  message: 'Bạn đặt hoa quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau ít phút hoặc liên hệ shop.'
});
const orderStatusLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, max: 30, skip: isAdminRequest,
  message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.'
});
const reviewLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, max: 5, skip: isAdminRequest,
  message: 'Bạn gửi đánh giá quá nhiều lần. Vui lòng thử lại sau.'
});

// SEED_DIR: dữ liệu mẫu theo git (chỉ đọc). DATA_DIR: nơi lưu dữ liệu thật (đơn hàng, sản phẩm...).
// Trên VPS đặt DATA_DIR ngoài thư mục repo (vd /var/lib/flower-shop-data) để `git reset --hard`
// khi deploy không bao giờ ghi đè dữ liệu đang chạy.
const SEED_DIR = path.join(__dirname, 'data');
const DATA_DIR = process.env.DATA_DIR || SEED_DIR;
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
}

// ----------------------------------------------------
// SHARED PERSISTENT STORAGE (Neon Database & In-Memory Fallback)
// Lưu trữ dữ liệu bền vững qua Neon PostgreSQL & Local fallback
// ----------------------------------------------------
let sql = null;
if (process.env.DATABASE_URL) {
  try {
    sql = neon(process.env.DATABASE_URL);
  } catch (e) {
    console.warn('Neon client initialization note:', e.message);
  }
}

// Bọc mọi promise (DB query, fetch bên thứ 3, ...) bằng timeout để tránh
// request treo khi bên ngoài không phản hồi (kết nối mạng treo, DB không reachable, API bên thứ 3 hang).
const withTimeout = (promise, ms, label = 'operation') => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const DB_TIMEOUT_MS = 10000;

// fetch() ra API bên thứ 3 kèm timeout (mặc định 15s) qua AbortController,
// để không bao giờ treo tới giới hạn tối đa của function.
const fetchWithTimeout = async (url, options = {}, ms = 15000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

let isTableInitialized = false;
const ensureTable = async () => {
  if (!sql || isTableInitialized) return;
  try {
    await withTimeout(sql`
      CREATE TABLE IF NOT EXISTS flora_store (
        key VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `, DB_TIMEOUT_MS, 'ensureTable');
    isTableInitialized = true;
  } catch (err) {
    console.warn('ensureTable note:', err.message);
  }
};

// In-memory cache for fast access within warm container instances
const memoryDb = new Map();

// Helpers for JSON Database persistence
const readJson = async (fileName) => {
  const key = fileName.replace('.json', '');

  // 1. Neon Database (Lưu trữ dùng chung giữa backend & mọi thiết bị)
  if (sql) {
    try {
      await ensureTable();
      const rows = await withTimeout(
        sql`SELECT data FROM flora_store WHERE key = ${key}`,
        DB_TIMEOUT_MS,
        `readJson(${key})`
      );
      if (rows && rows.length > 0 && rows[0].data !== undefined) {
        const data = rows[0].data;
        memoryDb.set(fileName, data);
        return data;
      }
    } catch (dbErr) {
      console.warn(`[Neon DB] Lỗi đọc ${key}:`, dbErr.message);
    }
  }

  // 2. In-memory cache
  if (memoryDb.has(fileName)) {
    return memoryDb.get(fileName);
  }

  // 3. Fallback /tmp container local
  const tmpPath = path.join('/tmp', fileName);
  if (fs.existsSync(tmpPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(tmpPath, 'utf-8'));
      memoryDb.set(fileName, data);
      return data;
    } catch (err) {}
  }

  // 4. Fallback DATA_DIR (tệp bundle gốc)
  let filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath) && DATA_DIR !== SEED_DIR && fileName !== 'admin.json') {
    // Lần chạy đầu với DATA_DIR mới: lấy dữ liệu mẫu từ git làm điểm khởi đầu
    filePath = path.join(SEED_DIR, fileName);
  }
  if (!fs.existsSync(filePath)) {
    return fileName.includes('settings') ? {} : [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    memoryDb.set(fileName, data);
    return data;
  } catch (err) {
    console.error(`Lỗi đọc file ${fileName}:`, err);
    // File sản phẩm hỏng phải báo lỗi (HTTP 500), KHÔNG trả [] — nếu không trang khách bị xóa trắng,
    // và thao tác thêm/sửa tiếp theo sẽ ghi đè file bằng danh sách gần như rỗng.
    if (fileName === 'products.json') throw err;
    return fileName.includes('settings') ? {} : [];
  }
};

const writeJson = async (fileName, data) => {
  const key = fileName.replace('.json', '');
  memoryDb.set(fileName, data);

  // 1. Lưu vào Neon Database (Đồng bộ tức thì lên đám mây cho mọi container)
  if (sql) {
    try {
      await ensureTable();
      const jsonStr = JSON.stringify(data);
      await withTimeout(sql`
        INSERT INTO flora_store (key, data, updated_at)
        VALUES (${key}, ${jsonStr}, NOW())
        ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `, DB_TIMEOUT_MS, `writeJson(${key})`);
    } catch (dbErr) {
      console.error(`[Neon DB] Lỗi ghi ${key}:`, dbErr.message);
    }
  }

  // 2. Ghi fallback vào filesystem cục bộ
  try {
    const filePath = path.join(DATA_DIR, fileName);
    const tmpFile = `${filePath}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, filePath);
  } catch (err) {
    try {
      const tmpPath = path.join('/tmp', fileName);
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (tmpErr) {
      console.warn(`Không thể ghi file ${fileName}:`, tmpErr.message);
    }
  }
};

// ----------------------------------------------------
// REAL-TIME SERVER-SENT EVENTS (SSE) FOR ADMINS
// ----------------------------------------------------
const sseClients = new Map(); // res -> { isAdmin }

// Sự kiện chứa thông tin riêng tư của khách (tên, SĐT, địa chỉ) chỉ gửi cho kết nối admin đã xác thực
const ADMIN_ONLY_EVENTS = new Set(['NEW_ORDER', 'ORDER_STATUS_CHANGED']);

export const broadcastAdminEvent = (eventPayload) => {
  const message = `data: ${JSON.stringify(eventPayload)}\n\n`;
  const adminOnly = ADMIN_ONLY_EVENTS.has(eventPayload?.type);
  sseClients.forEach((meta, client) => {
    if (adminOnly && !meta.isAdmin) return;
    try {
      client.write(message);
    } catch (e) {
      sseClients.delete(client);
    }
  });
};

// POST /api/admin/events-ticket (Admin đổi JWT lấy vé dùng một lần, hiệu lực 60s, để mở luồng SSE đầy đủ)
app.post('/api/admin/events-ticket', requireAdminMiddleware, (req, res) => {
  res.json({ success: true, ticket: issueSseTicket() });
});

// GET /api/admin/events (SSE Stream). Không có vé hợp lệ -> chỉ nhận sự kiện công khai (sản phẩm),
// KHÔNG nhận đơn hàng.
app.get('/api/admin/events', (req, res) => {
  const isAdmin = consumeSseTicket(req.query.ticket);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Stream Active', isAdmin })}\n\n`);
  sseClients.set(res, { isAdmin });

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// ----------------------------------------------------
// 0. ADMIN AUTHENTICATION API (Xác thực đăng nhập & Đổi mật khẩu)
// ----------------------------------------------------

// POST /api/admin/login
app.post('/api/admin/login', async (req, res) => {
  try {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const rateLimit = checkLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      return res.status(429).json({ success: false, message: rateLimit.message });
    }

    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tài khoản và mật khẩu.' });
    }

    let adminData = await readJson('admin.json');
    if (!adminData || !adminData.hash || !adminData.salt) {
      adminData = getInitialAdminCredentials();
      await writeJson('admin.json', adminData);
    }

    const isMatchUser = (adminData.username || 'admin').toLowerCase() === String(username).trim().toLowerCase();
    const isMatchPass = verifyPassword(password, adminData.hash, adminData.salt);

    if (!isMatchUser || !isMatchPass) {
      recordFailedLogin(ip);
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    clearFailedLogin(ip);
    const userPayload = {
      username: adminData.username,
      name: adminData.name || 'Quản Trị Viên',
      role: adminData.role || 'SUPER_ADMIN'
    };

    const token = createJwtToken(userPayload);
    res.json({
      success: true,
      token,
      user: userPayload,
      message: 'Đăng nhập quản trị viên thành công.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/me
app.get('/api/admin/me', requireAdminMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.adminUser
  });
});

// POST /api/admin/change-password
app.post('/api/admin/change-password', requireAdminMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
    }

    let adminData = await readJson('admin.json');
    if (!adminData || !adminData.hash || !adminData.salt) {
      adminData = getInitialAdminCredentials();
    }

    if (!verifyPassword(currentPassword, adminData.hash, adminData.salt)) {
      return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
    }

    const { hash, salt } = hashPassword(newPassword);
    adminData.hash = hash;
    adminData.salt = salt;
    adminData.updatedAt = new Date().toISOString();

    await writeJson('admin.json', adminData);
    res.json({ success: true, message: 'Đổi mật khẩu quản trị thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 1. PRODUCTS REST API (Quản Lý Sản Phẩm Mẫu Hoa)
// ----------------------------------------------------

// ----- Ảnh sản phẩm -----
// Ảnh admin tải lên được lưu dạng data URI trong products.json (mỗi ảnh có thể 5-8MB). API KHÔNG nhét khối đó vào
// danh sách/phản hồi mà trả đường dẫn /api/products/:id/image?v=<hash> để trình duyệt tải riêng, lazy và cache lâu.
// Dữ liệu lưu trên đĩa giữ nguyên (không cần di chuyển dữ liệu, hoàn tác chỉ cần revert code).
const OWN_IMAGE_URL_RE = /^\/api\/products\/[^/?#]+\/image(?:[?#]|$)/;
const IMAGE_MIME_RE = /^image\/(jpeg|png|webp|gif|avif|bmp|svg\+xml)$/i;
const imageVersionCache = new Map();

const imageVersion = (id, src) => {
  const cached = imageVersionCache.get(id);
  if (cached && cached.src === src) return cached.v;
  const v = crypto.createHash('sha1').update(src).digest('hex').slice(0, 12);
  imageVersionCache.set(id, { src, v });
  return v;
};

const toPublicProduct = (p) => {
  if (!p || typeof p.image !== 'string' || !p.image.startsWith('data:')) return p;
  return { ...p, image: `/api/products/${encodeURIComponent(p.id)}/image?v=${imageVersion(p.id, p.image)}` };
};

// Client gửi lại chính đường dẫn ảnh này khi lưu sản phẩm: bỏ đi để KHÔNG ghi đè ảnh thật đang lưu
const stripOwnImageUrl = (body) => {
  if (body && typeof body.image === 'string' && OWN_IMAGE_URL_RE.test(body.image)) {
    const { image: _ownUrl, ...rest } = body;
    return rest;
  }
  return body || {};
};

const parseImageDataUri = (uri) => {
  if (typeof uri !== 'string' || !uri.startsWith('data:')) return null;
  const comma = uri.indexOf(',');
  if (comma === -1) return null;
  const meta = uri.slice(5, comma);
  const mime = (meta.split(';')[0] || '').toLowerCase();
  if (!IMAGE_MIME_RE.test(mime)) return null;
  const payload = uri.slice(comma + 1);
  try {
    const buffer = /;base64$/i.test(meta) ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'binary');
    return buffer.length > 0 ? { mime, buffer } : null;
  } catch (e) {
    return null;
  }
};

// GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const products = await readJson('products.json');
    res.json({ success: true, data: products.map(toPublicProduct), total: products.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----- Ảnh thu nhỏ -----
// Ảnh gốc admin tải lên có thể 5-8MB; trang chỉ cần vài trăm px. ?w=<240|480|800|1200> trả bản thu nhỏ (WebP nếu trình
// duyệt hỗ trợ, nếu không thì JPEG), tạo MỘT lần rồi cache trên đĩa. sharp là tùy chọn: không nạp được, bị tắt
// (IMAGE_THUMBNAILS=off) hoặc ảnh lỗi thì tự phục vụ ảnh gốc như trước, không bao giờ làm hỏng API.
const THUMB_WIDTHS = [240, 480, 800, 1200];
const WARM_WIDTHS = [480, 800];
const IMAGE_CACHE_DIR = path.resolve(DATA_DIR, 'image-cache');

let sharpLib = null;
const sharpReady = (async () => {
  if (process.env.IMAGE_THUMBNAILS === 'off') return;
  try {
    const mod = await import('sharp');
    sharpLib = mod.default;
    sharpLib.cache(false);
    sharpLib.concurrency(1);
  } catch (e) {
    console.warn('[ảnh] Không nạp được sharp, phục vụ ảnh gốc (không thu nhỏ):', e.message);
  }
})();

const dataUriMime = (uri) => {
  if (typeof uri !== 'string' || !uri.startsWith('data:')) return '';
  const comma = uri.indexOf(',');
  return comma === -1 ? '' : (uri.slice(5, comma).split(';')[0] || '').toLowerCase();
};
const canThumbnail = (mime) => /^image\/(jpeg|png|webp|bmp|avif)$/.test(mime);

const thumbFileBase = (id) =>
  `${String(id).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 40)}-${crypto.createHash('sha1').update(String(id)).digest('hex').slice(0, 6)}`;
const thumbPath = (id, version, width, format) =>
  path.join(IMAGE_CACHE_DIR, `${thumbFileBase(id)}__${version}__${width}.${format === 'webp' ? 'webp' : 'jpg'}`);

const removeThumbnails = (id, keepVersion = null) => {
  try {
    const prefix = `${thumbFileBase(id)}__`;
    for (const f of fs.readdirSync(IMAGE_CACHE_DIR)) {
      if (f.startsWith(prefix) && !(keepVersion && f.startsWith(`${prefix}${keepVersion}__`))) {
        fs.unlinkSync(path.join(IMAGE_CACHE_DIR, f));
      }
    }
  } catch (e) {}
};

// Chỉ xử lý 1 ảnh tại một thời điểm (VPS 1 CPU / 1GB RAM) và gộp các yêu cầu trùng nhau
let thumbChain = Promise.resolve();
const thumbInflight = new Map();
const ensureThumbnail = (product, width, format) => {
  const version = imageVersion(product.id, product.image);
  const file = thumbPath(product.id, version, width, format);
  if (fs.existsSync(file)) return Promise.resolve(file);
  if (thumbInflight.has(file)) return thumbInflight.get(file);

  const job = thumbChain.then(async () => {
    if (fs.existsSync(file)) return file;
    const parsed = parseImageDataUri(product.image);
    if (!parsed || !canThumbnail(parsed.mime)) throw new Error('định dạng ảnh không hỗ trợ thu nhỏ');
    // rotate(): áp dụng hướng xoay EXIF của ảnh chụp điện thoại; đầu ra không mang EXIF (kể cả vị trí GPS)
    let pipeline = sharpLib(parsed.buffer, { failOn: 'none' }).rotate().resize({ width, withoutEnlargement: true });
    pipeline = format === 'webp'
      ? pipeline.webp({ quality: 80 })
      : pipeline.flatten({ background: '#ffffff' }).jpeg({ quality: 82, progressive: true, mozjpeg: true });
    const out = await pipeline.toBuffer();
    fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, out);
    fs.renameSync(tmp, file);
    removeThumbnails(product.id, version);
    return file;
  });
  thumbChain = job.catch(() => {});
  const tracked = job.finally(() => thumbInflight.delete(file));
  thumbInflight.set(file, tracked);
  return tracked;
};

// Tạo sẵn ảnh thu nhỏ nền (sau khi khởi động và sau khi admin tải ảnh mới) để khách đầu tiên không phải chờ
const warmThumbnails = async (products) => {
  await sharpReady;
  if (!sharpLib) return;
  for (const p of products || []) {
    if (!canThumbnail(dataUriMime(p && p.image))) continue;
    for (const w of WARM_WIDTHS) {
      try { await ensureThumbnail(p, w, 'webp'); } catch (e) {}
    }
  }
};

// GET /api/products/:id/image (ảnh sản phẩm tải lên; URL có ?v=<hash> nên cache được vô thời hạn)
app.get('/api/products/:id/image', async (req, res) => {
  try {
    const products = (await readJson('products.json')) || [];
    const product = products.find(p => p.id === req.params.id);
    const mime = product ? dataUriMime(product.image) : '';
    if (!IMAGE_MIME_RE.test(mime)) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không có ảnh tải lên' });
    }
    const cacheControl = req.query.v ? 'public, max-age=31536000, immutable' : 'public, max-age=300';

    const sendOriginal = () => {
      const parsed = parseImageDataUri(product.image);
      if (!parsed) return res.status(404).json({ success: false, message: 'Sản phẩm không có ảnh tải lên' });
      res.setHeader('Content-Type', parsed.mime);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (parsed.mime === 'image/svg+xml') {
        res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'; style-src 'unsafe-inline'");
      }
      res.setHeader('Cache-Control', cacheControl);
      return res.send(parsed.buffer);
    };

    const width = Number(req.query.w);
    if (THUMB_WIDTHS.includes(width) && canThumbnail(mime)) {
      await sharpReady;
      if (sharpLib) {
        try {
          const format = /image\/webp/i.test(req.headers.accept || '') ? 'webp' : 'jpeg';
          const file = await ensureThumbnail(product, width, format);
          res.setHeader('Vary', 'Accept');
          return res.sendFile(
            file,
            { cacheControl: false, headers: { 'Cache-Control': cacheControl, 'X-Content-Type-Options': 'nosniff' } },
            (err) => { if (err && !res.headersSent) sendOriginal(); }
          );
        } catch (thumbErr) {
          console.warn(`[ảnh] Không tạo được ảnh thu nhỏ cho ${product.id}, dùng ảnh gốc:`, thumbErr.message);
        }
      }
    }
    return sendOriginal();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products (Thêm mẫu hoa mới)
app.post('/api/products', requireAdminMiddleware, async (req, res) => {
  try {
    req.body = stripOwnImageUrl(req.body);
    const products = (await readJson('products.json')) || [];
    const newProduct = {
      id: req.body.id || `fl-${Date.now()}`,
      name: req.body.name || 'Bó Hoa Mới',
      subtitle: req.body.subtitle || '',
      price: Number(req.body.price) || 500000,
      originalPrice: Number(req.body.originalPrice) || Number(req.body.price) || 600000,
      occasion: req.body.occasion || 'love',
      colorTone: req.body.colorTone || 'pastel',
      image: req.body.image || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
      tags: req.body.tags || ['Mẫu Mới'],
      meaning: req.body.meaning || 'Gửi gắm yêu thương.',
      flowerTypes: req.body.flowerTypes || ['Hoa Hồng Nhập Khẩu', 'Hoa Baby'],
      rating: 5.0,
      reviewsCount: 0,
      freshDays: Number(req.body.freshDays) || 4,
      isAvailable: true,
      createdAt: req.body.createdAt || new Date().toISOString(),
      updatedAt: req.body.updatedAt || new Date().toISOString()
    };

    products.unshift(newProduct);
    await writeJson('products.json', products);
    if (dataUriMime(newProduct.image)) warmThumbnails([newProduct]);

    broadcastAdminEvent({ type: 'PRODUCT_ADDED', product: toPublicProduct(newProduct) });
    broadcastAdminEvent({ type: 'PRODUCT_UPDATED', product: toPublicProduct(newProduct) });
    res.status(201).json({ success: true, data: toPublicProduct(newProduct) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id (Cập nhật mẫu hoa)
app.put('/api/products/:id', requireAdminMiddleware, async (req, res) => {
  try {
    req.body = stripOwnImageUrl(req.body);
    const { id } = req.params;
    let products = (await readJson('products.json')) || [];
    let index = products.findIndex(p => p.id === id);

    if (index === -1) {
      // Nếu sản phẩm chưa có trong file products.json nhưng được sửa
      const newEntry = {
        id,
        name: req.body.name || 'Mẫu Hoa',
        subtitle: req.body.subtitle || '',
        price: Number(req.body.price) || 500000,
        originalPrice: Number(req.body.originalPrice) || Number(req.body.price) || 500000,
        occasion: req.body.occasion || 'love',
        colorTone: req.body.colorTone || 'pastel',
        image: req.body.image || '',
        tags: req.body.tags || ['Mẫu Mới'],
        meaning: req.body.meaning || '',
        flowerTypes: req.body.flowerTypes || [],
        rating: 5.0,
        reviewsCount: 0,
        freshDays: Number(req.body.freshDays) || 4,
        isAvailable: req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : true,
        ...req.body,
        updatedAt: req.body.updatedAt || new Date().toISOString()
      };
      products.push(newEntry);
      index = products.length - 1;
    } else {
      products[index] = {
        ...products[index],
        ...req.body,
        price: req.body.price ? Number(req.body.price) : products[index].price,
        originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : products[index].originalPrice,
        isAvailable: req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : products[index].isAvailable,
        updatedAt: req.body.updatedAt || new Date().toISOString()
      };
    }

    await writeJson('products.json', products);
    if (dataUriMime(products[index].image)) warmThumbnails([products[index]]);
    else removeThumbnails(id);
    broadcastAdminEvent({ type: 'PRODUCT_UPDATED', product: toPublicProduct(products[index]) });
    res.json({ success: true, data: toPublicProduct(products[index]) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/products/:id/toggle (Bật/Tắt hiển thị)
app.patch('/api/products/:id/toggle', requireAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    let products = (await readJson('products.json')) || [];
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu hoa' });
    }

    products[index].isAvailable = products[index].isAvailable === false ? true : false;
    products[index].updatedAt = new Date().toISOString();
    await writeJson('products.json', products);

    broadcastAdminEvent({ type: 'PRODUCT_UPDATED', product: toPublicProduct(products[index]) });
    res.json({ success: true, data: toPublicProduct(products[index]) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id (Xóa mẫu hoa)
app.delete('/api/products/:id', requireAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    let products = (await readJson('products.json')) || [];
    const filtered = products.filter(p => p.id !== id);

    if (filtered.length === products.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu hoa' });
    }

    await writeJson('products.json', filtered);
    imageVersionCache.delete(id);
    removeThumbnails(id);
    broadcastAdminEvent({ type: 'PRODUCT_DELETED', productId: id });
    res.json({ success: true, message: 'Đã xóa mẫu hoa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ----------------------------------------------------
// 2. ORDERS REST API (Quản Lý Đơn Hàng & Vận Hành Florist)
// ----------------------------------------------------

// GET /api/orders
app.get('/api/orders', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let isAdmin = false;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = (await import('./auth.js')).verifyJwtToken(authHeader.slice(7).trim());
      if (decoded) isAdmin = true;
    }

    if (!isAdmin) {
      // Khách vãng lai không được phép xem toàn bộ danh sách đơn hàng chứa thông tin riêng tư
      return res.json({ success: true, data: [], total: 0, isGuest: true });
    }

    const orders = await readJson('orders.json');
    res.json({ success: true, data: orders, total: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mã đơn là "khóa" để khách xem/duyệt ảnh đơn của mình nên phải không đoán được:
// 8 ký tự ngẫu nhiên mật mã học (bảng chữ cái bỏ ký tự dễ nhầm 0/O/1/I) ~ 40 bit.
const ORDER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateOrderCode = (existing) => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const bytes = crypto.randomBytes(8);
    let code = 'FB-';
    for (let i = 0; i < 8; i++) code += ORDER_CODE_ALPHABET[bytes[i] % ORDER_CODE_ALPHABET.length];
    if (!existing.some((o) => o.id === code || o.orderCode === code)) return code;
  }
  throw new Error('Không tạo được mã đơn hàng');
};

const cleanText = (v, max, fallback = '') => {
  if (typeof v !== 'string') return fallback;
  const t = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
  return t || fallback;
};
const PHONE_RE = /^[0-9+\s.()-]{8,20}$/;
const MAX_ORDER_AMOUNT = 200000000;
const MAX_ORDER_ITEMS = 50;

// Kiểm tra và làm sạch dữ liệu đơn hàng do khách gửi; trả về { error } hoặc { value }
const validateOrderInput = (body) => {
  const b = body || {};
  const customerPhone = cleanText(b.customerPhone || b.senderPhone, 20);
  const receiverPhone = cleanText(b.receiverPhone, 20);
  if (customerPhone && !PHONE_RE.test(customerPhone)) return { error: 'Số điện thoại người đặt không hợp lệ.' };
  if (receiverPhone && !PHONE_RE.test(receiverPhone)) return { error: 'Số điện thoại người nhận không hợp lệ.' };

  const totalAmount = Number(b.totalAmount);
  if (!Number.isFinite(totalAmount) || totalAmount < 0 || totalAmount > MAX_ORDER_AMOUNT) {
    return { error: 'Tổng tiền đơn hàng không hợp lệ.' };
  }

  const rawItems = Array.isArray(b.items) ? b.items : [];
  if (rawItems.length > MAX_ORDER_ITEMS) return { error: 'Đơn hàng có quá nhiều sản phẩm.' };
  const items = [];
  for (const it of rawItems) {
    const price = Number(it && it.price);
    if (!it || !Number.isFinite(price) || price < 0 || price > MAX_ORDER_AMOUNT) {
      return { error: 'Thông tin sản phẩm trong đơn không hợp lệ.' };
    }
    items.push({ name: cleanText(it.name, 300, 'Sản phẩm'), price });
  }

  return {
    value: {
      customerName: cleanText(b.customerName || b.senderName, 100, 'Khách hàng'),
      customerPhone: customerPhone || '0901 234 567',
      receiverName: cleanText(b.receiverName, 100, 'Người nhận hoa'),
      receiverPhone: receiverPhone || '0988 765 432',
      receiverAddress: cleanText(b.receiverAddress, 300, 'TP. Buôn Ma Thuột, Đắk Lắk'),
      productName: cleanText(b.productName, 300, 'Bó hoa tươi nghệ thuật'),
      cardMessage: cleanText(b.cardMessage, 1000, 'Gửi gắm yêu thương!'),
      senderSign: cleanText(b.senderSign || b.senderName, 100, 'Người gửi'),
      deliverySlot: cleanText(b.deliverySlot, 100, 'Hỏa tốc 90 phút'),
      isAnonymous: Boolean(b.isAnonymous),
      totalAmount,
      items
    }
  };
};

// POST /api/orders
app.post('/api/orders', orderCreateLimiter, async (req, res) => {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const currentTime = `${timeStr} (${dateStr})`;

    const input = validateOrderInput(req.body);
    if (input.error) return res.status(400).json({ success: false, message: input.error });
    const v = input.value;

    const orders = (await readJson('orders.json')) || [];
    const newOrderCode = generateOrderCode(orders);
    const newOrder = {
      id: newOrderCode,
      orderCode: newOrderCode,
      customerName: v.customerName,
      customerPhone: v.customerPhone,
      receiverName: v.receiverName,
      receiverPhone: v.receiverPhone,
      receiverAddress: v.receiverAddress,
      isAnonymous: v.isAnonymous,
      productName: v.productName,
      cardMessage: v.cardMessage,
      senderSign: v.senderSign,
      deliverySlot: v.deliverySlot,
      totalAmount: v.totalAmount,
      status: 'ARRANGING',
      florist: 'Thợ cắm hoa Minh Thư (Studio A)',
      floristAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      proofPhotoUrl: null, // chỉ admin được gắn ảnh hoa thật sau khi cắm xong
      isApproved: false,
      createdAt: currentTime,
      items: v.items
    };

    orders.unshift(newOrder);
    await writeJson('orders.json', orders);

    broadcastAdminEvent({
      type: 'NEW_ORDER',
      order: newOrder,
      timestamp: new Date().toISOString()
    });

    // Tự động thông báo đơn hàng mới qua Telegram Bot tới chủ tiệm (từ cấu hình Admin)
    (async () => {
      try {
        const settings = (await readJson('settings.json')) || {};
        const token = cleanTelegramToken(settings.telegramBotToken);
        const chatId = cleanTelegramChatId(settings.telegramChatId);
        if (!token || !chatId) return;

        const orderHtml = `🌸 <b>CÓ ĐƠN ĐẶT HOA MỚI!</b> (#${escapeTelegramHtml(newOrder.orderCode)})\n\n` +
          `👤 <b>Khách đặt:</b> ${escapeTelegramHtml(newOrder.customerName)} (${escapeTelegramHtml(newOrder.customerPhone)})\n` +
          `💐 <b>Mẫu hoa:</b> ${escapeTelegramHtml(newOrder.productName)}\n` +
          `💰 <b>Tổng tiền:</b> ${Number(newOrder.totalAmount).toLocaleString('vi-VN')}đ\n` +
          `⏱️ <b>Khung giờ:</b> ${escapeTelegramHtml(newOrder.deliverySlot)}\n` +
          `📍 <b>Giao tới:</b> ${escapeTelegramHtml(newOrder.receiverAddress)}\n\n` +
          `👉 <i>Mở Bảng Điều Hành Admin Ngọc Flower để duyệt ảnh và cắm hoa nhé!</i>`;

        const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
        await fetchWithTimeout(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: orderHtml,
            parse_mode: 'HTML'
          })
        }, 10000);
      } catch (tgErr) {
        console.warn('Lỗi gửi Telegram đơn hàng tới tiệm:', tgErr.message);
      }
    })().catch(() => {});

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/orders/:id/status
app.patch('/api/orders/:id/status', orderStatusLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    let orders = (await readJson('orders.json')) || [];
    const index = orders.findIndex(o => o.id === id || o.orderCode === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    const authHeader = req.headers.authorization || '';
    const isAdmin = authHeader.startsWith('Bearer ') && Boolean(verifyJwtToken(authHeader.slice(7).trim()));

    let changes = req.body || {};
    if (isAdmin) {
      // Admin không được đổi mã định danh của đơn
      const { id: _id, orderCode: _code, ...rest } = changes;
      changes = rest;
    } else {
      // Khách chỉ được duyệt ảnh hoa của đơn đang ở trạng thái "Chờ duyệt ảnh"
      if (orders[index].status !== 'PHOTO_READY' || orders[index].isApproved) {
        return res.status(403).json({ success: false, message: 'Không có quyền cập nhật đơn hàng này.' });
      }
      changes = { isApproved: true, status: 'DELIVERING' };
    }

    orders[index] = {
      ...orders[index],
      ...changes,
      updatedAt: new Date().toISOString()
    };

    await writeJson('orders.json', orders);

    broadcastAdminEvent({
      type: 'ORDER_STATUS_CHANGED',
      order: orders[index]
    });

    res.json({ success: true, data: orders[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 3. TELEGRAM BOT NOTIFICATION WEBHOOK & AUTO-DETECT CHAT ID
// ----------------------------------------------------

// Clean helper for Telegram tokens
const cleanTelegramToken = (token) => {
  if (!token) return '';
  return token.trim().replace(/^bot/i, '');
};

const cleanTelegramChatId = (chatId) => {
  if (!chatId) return '';
  return String(chatId).trim();
};

// Endpoint tự động tìm Chat ID từ Bot Token 1-Chạm!
app.post('/api/notifications/telegram-get-chat-id', requireAdminMiddleware, async (req, res) => {
  try {
    const rawToken = req.body.botToken;
    if (!rawToken) {
      return res.status(400).json({ success: false, message: 'Vui lòng dán chuỗi Bot Token vào ô trên trước khi bấm dò tìm' });
    }

    const token = cleanTelegramToken(rawToken);
    const updatesUrl = `https://api.telegram.org/bot${token}/getUpdates`;
    const tgRes = await fetchWithTimeout(updatesUrl, {}, 10000);
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      let friendlyError = tgData.description;
      if (tgData.error_code === 401 || tgData.description?.includes('Unauthorized')) {
        friendlyError = 'Bot Token không đúng hoặc đã bị xóa. Hãy kiểm tra lại chuỗi Token từ @BotFather.';
      }
      return res.status(400).json({ 
        success: false, 
        message: `Lỗi kết nối Bot: ${friendlyError}` 
      });
    }

    const updates = tgData.result || [];
    if (updates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chưa nhận được tin nhắn nào! Bạn hãy mở Telegram, tìm bot của bạn, bấm nút START (hoặc gửi chữ "Hi") rồi bấm lại nút này nhé.'
      });
    }

    // Lấy tin nhắn mới nhất
    const lastUpdate = updates[updates.length - 1];
    const message = lastUpdate.message || lastUpdate.channel_post || lastUpdate.callback_query?.message;

    if (!message || !message.chat) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ID cuộc trò chuyện. Hãy gửi 1 tin nhắn bất kỳ đến bot.'
      });
    }

    const chatId = message.chat.id;
    const name = message.from?.first_name || message.chat?.first_name || message.chat?.title || 'Bạn';

    res.json({
      success: true,
      chatId: String(chatId),
      senderName: name,
      message: `Đã tìm thấy Chat ID của ${name}: ${chatId}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint test gửi thông báo đơn hàng qua Telegram
app.post('/api/notifications/telegram-test', requireAdminMiddleware, async (req, res) => {
  try {
    const { botToken, chatId, testOrder } = req.body;
    if (!botToken || !chatId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ cả Bot Token và Chat ID' });
    }

    const token = cleanTelegramToken(botToken);
    const targetChatId = cleanTelegramChatId(chatId);

    const order = testOrder || {
      orderCode: 'FB-TEST-2026',
      customerName: 'Anh Hoàng Nam',
      productName: 'Bó Hoa Juliet Nắng Ban Mai',
      totalAmount: 850000,
      deliverySlot: '14:00 - 16:00 Hôm nay',
      receiverAddress: 'Bitexco, Q.1'
    };

    // Dùng định dạng HTML an toàn 100%, không bị lỗi ký tự Markdown
    const htmlMessage = `🌸 <b>CÓ ĐƠN ĐẶT HOA MỚI!</b> (#${order.orderCode})\n\n` +
      `👤 <b>Khách đặt:</b> ${order.customerName}\n` +
      `💐 <b>Mẫu hoa:</b> ${order.productName}\n` +
      `💰 <b>Tổng tiền:</b> ${Number(order.totalAmount).toLocaleString('vi-VN')}đ\n` +
      `⏱️ <b>Khung giờ:</b> ${order.deliverySlot}\n` +
      `📍 <b>Giao tới:</b> ${order.receiverAddress}\n\n` +
      `👉 <i>Hãy mở Bảng Điều Hành Admin Ngọc Flower để duyệt ảnh và cắm hoa nhé!</i>`;

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const tgRes = await fetchWithTimeout(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: htmlMessage,
        parse_mode: 'HTML'
      })
    });

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      let explanation = tgData.description;
      if (tgData.description?.includes('bot was blocked by the user') || tgData.description?.includes('chat not found')) {
        explanation = 'LƯU Ý QUAN TRỌNG: Bạn chưa bấm START vào bot! Hãy mở ứng dụng Telegram, tìm đúng tên bot của bạn và bấm nút START để cho phép bot gửi tin nhắn nhé.';
      } else if (tgData.description?.includes('Unauthorized')) {
        explanation = 'Chuỗi Bot Token không chính xác. Hãy kiểm tra lại token được cấp bởi @BotFather.';
      }
      return res.status(400).json({ success: false, message: `Lỗi từ Telegram: ${explanation}` });
    }

    res.json({ success: true, message: '🎉 Thành công! Bot vừa gửi tin nhắn thông báo đến Telegram của bạn!', data: tgData.result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint test gửi cảnh báo sự cố máy chủ cho Developer
app.post('/api/notifications/telegram-server-alert-test', requireAdminMiddleware, async (req, res) => {
  try {
    const { botToken, chatId } = req.body;
    const result = await testDeveloperServerAlert(botToken, chatId);
    if (!result.success) {
      return res.status(400).json({ success: false, message: `Lỗi từ Telegram: ${result.message}` });
    }
    res.json({ 
      success: true, 
      message: '🚨 Đã gửi thành công tin nhắn cảnh báo sự cố máy chủ mẫu tới Telegram Developer!', 
      data: result.data 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 4. INVENTORY API
// ----------------------------------------------------
app.get('/api/inventory', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const inventory = await readJson('inventory.json');
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/inventory', requireAdminMiddleware, async (req, res) => {
  try {
    const newInventory = req.body;
    await writeJson('inventory.json', newInventory);
    res.json({ success: true, data: newInventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 5. DISCOUNTS & REVIEWS API
// ----------------------------------------------------
app.get('/api/discounts', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const discounts = await readJson('discounts.json');
    res.json({ success: true, data: discounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const reviews = await readJson('reviews.json');
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const SAFE_REVIEW_IMAGE_RE = /^(https?:\/\/|data:image\/(jpeg|png|webp|gif);base64,)/i;

app.post('/api/reviews', reviewLimiter, async (req, res) => {
  try {
    const b = req.body || {};
    const rating = Math.min(5, Math.max(1, Math.round(Number(b.rating)) || 5));
    const comment = cleanText(b.comment, 500);
    if (!comment) return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung đánh giá.' });
    const proofImage = typeof b.proofImage === 'string' && SAFE_REVIEW_IMAGE_RE.test(b.proofImage) && b.proofImage.length <= 2500000
      ? b.proofImage
      : null;

    const reviews = (await readJson('reviews.json')) || [];
    // Chỉ nhận các trường được phép (không spread body: tránh khách tự đặt id/likes/isVisible...)
    const newReview = {
      id: `REV-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      customerName: cleanText(b.customerName, 80, 'Khách hàng Ngọc Flower'),
      productName: cleanText(b.productName, 200),
      occasion: cleanText(b.occasion, 100),
      rating,
      comment,
      proofImage,
      createdAt: new Date().toISOString().split('T')[0],
      likes: 0,
      isVisible: true
    };
    reviews.unshift(newReview);
    await writeJson('reviews.json', reviews);
    res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 6. AI FLORIST VISION API
// ----------------------------------------------------
app.post('/api/ai/analyze-flower', async (req, res) => {
  try {
    const analysisPayload = {
      detectedFlowers: [
        'Hoa Hồng Juliet Anh Quốc (18 cành nở bung)',
        'Hoa Baby Hà Lan Trắng',
        'Lá Khuynh Diệp (Eucalyptus)',
        'Cúc Tana nhí đệm cánh'
      ],
      colorPalette: ['#F5D6CE', '#D1DFD6', '#E8998D', '#FAF8F5'],
      colorNames: ['Hồng Nude', 'Xanh Sage', 'Dusty Rose', 'Kem Sữa'],
      style: 'Hàn Quốc Tối Giản (Korean Botanical Elegance)',
      difficulty: 'Trung Bình Khá (Thợ cắm trong 45 phút)',
      priceRange: {
        min: 850000,
        max: 1050000
      },
      floristAdvice: 'Nên sử dụng giấy lụa mờ 2 lớp màu xanh sage kèm ruy băng thêu tên nghệ thuật để tôn trọn vẹn dáng hoa bồng bềnh.',
      summaryVietnamese: 'Mẫu hoa mang cảm giác ngọt ngào, tinh tế, thích hợp nhất khi làm quà tặng sinh nhật hoặc kỷ niệm ngày bên nhau.',
      analyzedAt: new Date().toISOString(),
      aiModel: 'Gemini-2.5-Flash Multimodal Vision Engine'
    };

    res.json({ success: true, data: analysisPayload });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi thẩm định AI: ' + error.message });
  }
});

// ----------------------------------------------------
// 7. ZALO ZNS & NOTIFICATION API
// ----------------------------------------------------
app.post('/api/zalo/send-zns', requireAdminMiddleware, async (req, res) => {
  try {
    const { phone, customerName, orderCode, photoUrl, accessToken } = req.body;

    const payload = {
      phone: phone ? phone.replace(/\D/g, '') : '0901234567',
      template_id: '318492',
      template_data: {
        customer_name: customerName || 'Quý khách',
        order_code: orderCode || 'FB-89241',
        photo_url: photoUrl || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
        status: 'Đã cắm hoa hoàn tất - Chờ duyệt ảnh',
        time: new Date().toLocaleTimeString('vi-VN')
      },
      tracking_id: `zns_${orderCode}_${Date.now()}`
    };

    if (accessToken) {
      try {
        const response = await fetchWithTimeout('https://business.openapi.zalo.me/message/template', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': accessToken
          },
          body: JSON.stringify(payload)
        }, 10000);
        const liveData = await response.json();
        return res.json({ success: true, isLiveApi: true, data: liveData });
      } catch (err) {
        console.warn('Zalo API sandbox fallback:', err.message);
      }
    }

    res.json({
      success: true,
      isLiveApi: false,
      message: `Đã gửi thành công thông báo ZNS đến SĐT ${payload.phone}`,
      data: payload
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 8. SETTINGS API
// ----------------------------------------------------
app.get('/api/settings', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const settings = (await readJson('settings.json')) || {};
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let isAdmin = false;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = (await import('./auth.js')).verifyJwtToken(authHeader.slice(7).trim());
      if (decoded) isAdmin = true;
    }

    if (!isAdmin) {
      // Giấu các token nhạy cảm đối với người dùng thông thường
      const safeSettings = {
        ...settings,
        telegramBotToken: settings.telegramBotToken ? '••••••••' : '',
        facebookSettings: {
          ...(settings.facebookSettings || {}),
          pageAccessToken: settings.facebookSettings?.pageAccessToken ? '••••••••' : '',
          verifyToken: settings.facebookSettings?.verifyToken ? '••••••••' : ''
        }
      };
      return res.json({ success: true, data: safeSettings });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/settings', requireAdminMiddleware, async (req, res) => {
  try {
    const current = (await readJson('settings.json')) || {};
    const updated = {
      ...current,
      ...req.body,
      updatedAt: req.body.updatedAt || new Date().toISOString()
    };
    await writeJson('settings.json', updated);
    res.json({ success: true, data: updated, message: 'Đã lưu cấu hình cài đặt thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 8. FACEBOOK MESSENGER WEBHOOK & GRAPH API INTEGRATION
// ----------------------------------------------------

// Helper gửi tin nhắn qua Facebook Graph API Send API
const callFacebookSendApi = async (pageAccessToken, recipientId, messageText, quickReplies = []) => {
  if (!pageAccessToken) {
    return {
      success: true,
      isMock: true,
      message: 'Chế độ giả lập (Chưa cấu hình Page Access Token)',
      recipientId,
      text: messageText
    };
  }

  const messagePayload = { text: messageText };
  if (quickReplies && quickReplies.length > 0) {
    messagePayload.quick_replies = quickReplies.map(qr => ({
      content_type: 'text',
      title: qr.title,
      payload: qr.payload || qr.title
    }));
  }

  const graphUrl = `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`;
  const response = await fetchWithTimeout(graphUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: messagePayload
    })
  }, 10000);

  const resData = await response.json();
  if (resData.error) {
    throw new Error(`Facebook Graph API Lỗi: ${resData.error.message}`);
  }
  return { success: true, isLiveApi: true, data: resData };
};

// 8.1. Meta Webhook Verification (Xác thực Webhook với Meta Developer Portal)
app.get('/api/facebook/webhook', async (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const settings = (await readJson('settings.json')) || {};
    // Không còn verify token mặc định công khai: phải cấu hình trong Admin > Cài đặt Facebook
    const expectedToken = settings.facebookSettings?.verifyToken;

    if (mode && token) {
      if (expectedToken && mode === 'subscribe' && token === expectedToken) {
        console.log('✅ [Facebook Webhook] Đã xác thực thành công Webhook với Meta for Developers!');
        return res.status(200).send(challenge);
      } else {
        console.warn('⚠️ [Facebook Webhook] Từ chối: Verify Token không khớp');
        return res.status(403).send('Forbidden: Token mismatch');
      }
    }
    return res.status(400).send('Bad Request: Thiếu thông số xác thực hub.mode hoặc hub.verify_token');
  } catch (error) {
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

// 8.2. Nhận tin nhắn sự kiện từ Webhook Facebook Messenger & Tự động phản hồi thông minh (Chatbot)
// Xác thực chữ ký X-Hub-Signature-256 (HMAC-SHA256 của body thô với App Secret). Thiếu secret -> từ chối hết.
const verifyFacebookSignature = (req) => {
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const header = req.headers['x-hub-signature-256'];
  if (!appSecret || typeof header !== 'string' || !req.rawBody) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(req.rawBody).digest('hex');
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

app.post('/api/facebook/webhook', async (req, res) => {
  try {
    if (!process.env.FACEBOOK_APP_SECRET) {
      console.warn('⚠️ [Facebook Webhook] Từ chối: chưa đặt FACEBOOK_APP_SECRET trong .env');
      return res.sendStatus(503);
    }
    if (!verifyFacebookSignature(req)) {
      console.warn('⚠️ [Facebook Webhook] Từ chối: chữ ký X-Hub-Signature-256 không hợp lệ');
      return res.sendStatus(403);
    }
    const body = req.body;

    if (body.object === 'page') {
      const settings = (await readJson('settings.json')) || {};
      const fbConfig = settings.facebookSettings || {};

      for (const entry of (body.entry || [])) {
        const webhookEvent = entry.messaging?.[0];
        if (!webhookEvent) continue;

        const senderPsid = webhookEvent.sender?.id;
        const userMessage = webhookEvent.message?.text?.trim() || '';

        console.log(`📩 [Facebook Messenger] Nhận tin nhắn từ PSID ${senderPsid}: "${userMessage}"`);

        // Nếu bật Auto Reply và có senderPsid
        if (fbConfig.autoReplyEnabled !== false && senderPsid && userMessage) {
          const lowerText = userMessage.toLowerCase();
          const orderMatch = userMessage.match(/FB-[\w\d]+/i);

          let replyText = '';
          const quickReplies = [
            { title: '💐 Xem mẫu hoa', payload: 'MENU' },
            { title: '🔍 Tra cứu đơn', payload: 'TRACK' },
            { title: '⚡ Giao gấp 60p', payload: 'EXPRESS' }
          ];

          // 1. Trường hợp khách hỏi mã đơn hàng (VD: "Kiểm tra đơn FB-89241")
          if (orderMatch) {
            const searchedCode = orderMatch[0].toUpperCase();
            const orders = (await readJson('orders.json')) || [];
            const found = orders.find(o => (o.orderCode || o.id || '').toUpperCase() === searchedCode);

            if (found) {
              const statusMap = {
                ARRANGING: 'Đang cắm tại tiệm',
                PHOTO_READY: 'Đã cắm xong - Chờ khách duyệt ảnh',
                DELIVERING: 'Đang trên đường giao hoa',
                COMPLETED: 'Đã giao hoa thành công'
              };
              replyText = `🌸 Thông tin đơn hàng #${found.orderCode}:\n` +
                `• Người nhận: ${found.receiverName}\n` +
                `• Mẫu hoa: ${found.productName}\n` +
                `• Trạng thái: ${statusMap[found.status] || found.status}\n` +
                `• Khung giờ: ${found.deliverySlot || 'Hỏa tốc'}\n` +
                (found.proofPhotoUrl ? `📸 Xem ảnh hoa thực tế: ${found.proofPhotoUrl}\n` : '') +
                `👉 Nếu quý khách cần thay đổi nội dung thiệp hoặc hỗ trợ gấp, vui lòng nhắn tin ngay tại đây nhé!`;
            } else {
              replyText = `🌸 Ngọc Flower đã tìm kiếm nhưng chưa thấy mã đơn #${searchedCode} trên hệ thống. Quý khách vui lòng kiểm tra lại mã đơn hoặc để lại số điện thoại đặt hoa để tiệm tra cứu nhé!`;
            }
          } 
          // 2. Trường hợp khách hỏi Menu / Mẫu hoa
          else if (lowerText.includes('hoa') || lowerText.includes('menu') || lowerText.includes('mẫu') || lowerText.includes('giá')) {
            const products = (await readJson('products.json')) || [];
            const topProducts = products.slice(0, 3).map(p => `• ${p.name}: ${Number(p.price).toLocaleString('vi-VN')}đ`).join('\n');
            replyText = `🌸 Dạ chào bạn! Các mẫu hoa thiết kế đang được yêu thích nhất hôm nay tại Ngọc Flower Studio:\n\n` +
              `${topProducts}\n\n` +
              `💐 Tất cả mẫu hoa đều được tặng kèm thiệp thiết kế & túi xách cao cấp. Bạn muốn tiệm tư vấn hoa cho dịp nào ạ?`;
          } 
          // 3. Chào mừng mặc định
          else {
            replyText = fbConfig.welcomeMessage || 
              'Dạ chào bạn! Ngọc Flower Studio rất vui được hỗ trợ bạn. Bạn muốn tư vấn đặt hoa theo dịp hay cần tra cứu tiến trình đơn hàng đã đặt ạ? 🌸';
          }

          // Gửi phản hồi qua Graph API nếu có Token, hoặc log nếu mock
          try {
            await callFacebookSendApi(fbConfig.pageAccessToken, senderPsid, replyText, quickReplies);
          } catch (sendErr) {
            console.warn('⚠️ Lỗi gửi tin nhắn Facebook:', sendErr.message);
          }
        }
      }

      return res.status(200).send('EVENT_RECEIVED');
    }

    res.sendStatus(404);
  } catch (error) {
    console.error('Lỗi xử lý Facebook Webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8.3. API gửi tin nhắn chủ động qua Facebook Messenger (Send Message / Push Notification)
app.post('/api/facebook/send-message', requireAdminMiddleware, async (req, res) => {
  try {
    const { recipientId, message, pageAccessToken, quickReplies } = req.body;
    const settings = (await readJson('settings.json')) || {};
    const token = pageAccessToken || settings.facebookSettings?.pageAccessToken;
    const targetRecipient = recipientId || settings.facebookSettings?.adminRecipientId;

    if (!targetRecipient) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp recipientId (PSID người nhận) hoặc cấu hình Admin Recipient ID trong Cài đặt' 
      });
    }

    if (!message) {
      return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });
    }

    const result = await callFacebookSendApi(token, targetRecipient, message, quickReplies);
    res.json({
      success: true,
      message: result.isMock 
        ? '✅ Đã kích hoạt kịch bản gửi tin nhắn Messenger (Chế độ mô phỏng / Chưa gắn Token)'
        : '🎉 Đã gửi tin nhắn thành công qua Facebook Messenger!',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8.4. API thử nghiệm kết nối Facebook Messenger (Test Connection)
app.post('/api/facebook/test-connection', requireAdminMiddleware, async (req, res) => {
  try {
    const { pageId, pageAccessToken, recipientId, testOrder } = req.body;
    const cleanId = (pageId || 'tiemhoaflorabloom').trim();

    const order = testOrder || {
      orderCode: 'FB-FB-TEST',
      customerName: 'Khách hàng Messenger',
      productName: 'Bó Hoa Juliet Nắng Ban Mai',
      totalAmount: 850000,
      deliverySlot: 'Hỏa tốc 90 phút'
    };

    const notificationMessage = `🌸 [NGỌC FLOWER] THÔNG BÁO TEST KẾT NỐI MESSENGER!\n\n` +
      `👤 Khách hàng: ${order.customerName}\n` +
      `💐 Mẫu hoa: ${order.productName}\n` +
      `💰 Tổng tiền: ${Number(order.totalAmount).toLocaleString('vi-VN')}đ\n` +
      `⏱️ Khung giờ: ${order.deliverySlot}\n\n` +
      `👉 Kết nối Facebook Fanpage (@${cleanId}) đang hoạt động hoàn hảo!`;

    if (pageAccessToken && recipientId) {
      const graphResult = await callFacebookSendApi(pageAccessToken, recipientId, notificationMessage);
      return res.json({
        success: true,
        isLiveApi: true,
        message: `🎉 Đã gửi tin nhắn test thành công đến Messenger PSID: ${recipientId}`,
        messengerUrl: `https://m.me/${cleanId}`,
        data: graphResult
      });
    }

    // Nếu không có Token/PSID, trả về xác nhận cấu hình Fanpage và liên kết m.me
    res.json({
      success: true,
      isLiveApi: false,
      message: `🎉 Kết nối Fanpage @${cleanId} hợp lệ! Link chat: https://m.me/${cleanId}`,
      messengerUrl: `https://m.me/${cleanId}`,
      data: {
        pageId: cleanId,
        previewText: notificationMessage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 7. HEALTH CHECK
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Ngọc Flower Atelier Backend API',
    time: new Date().toISOString(),
    version: '1.1.0-auth'
  });
});

// ----------------------------------------------------
// 8. GLOBAL EXPRESS ERROR HANDLER & TELEGRAM BOT ALERT
// ----------------------------------------------------
app.use(async (err, req, res, next) => {
  // Lỗi do client (body quá lớn, JSON sai) trả đúng mã 4xx, không cảnh báo Telegram như sự cố máy chủ
  if (err && err.status >= 400 && err.status < 500 && !res.headersSent) {
    return res.status(err.status).json({
      success: false,
      message: err.status === 413 ? 'Dữ liệu gửi lên quá lớn.' : 'Yêu cầu không hợp lệ.'
    });
  }
  console.error('💥 [Express Error Handler]:', err);
  try {
    await notifyServerError(err, {
      location: 'Express Error Middleware',
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress
    });
  } catch (alertErr) {
    console.warn('Lỗi gửi cảnh báo Telegram:', alertErr.message);
  }

  if (!res.headersSent) {
    res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra sự cố máy chủ nội bộ. Quản trị viên và Bot giám sát đã được thông báo tự động.' 
    });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌸 Ngọc Flower API Server đang chạy tại: http://127.0.0.1:${PORT}`);
  // Tự động gửi thông báo Telegram khi server khởi động / reboot thành công
  notifyServerStartup({
    database: sql ? 'Neon PostgreSQL' : 'Local Storage Fallback',
    port: PORT
  }).catch((e) => console.warn('Note startup notify:', e.message));

  // Cảnh báo nếu admin vẫn dùng mật khẩu mặc định cũ từng nằm trong repo công khai
  readJson('admin.json').then((a) => {
    if (a && a.hash && a.salt && verifyPassword('Flora@2026', a.hash, a.salt)) {
      console.error('🚨 [Bảo mật] Tài khoản admin vẫn dùng mật khẩu mặc định công khai "Flora@2026". Hãy đổi mật khẩu NGAY (Admin > Đổi mật khẩu).');
    }
  }).catch(() => {});

  // Tạo sẵn ảnh thu nhỏ ở nền sau khi khởi động (chạy tuần tự, không chặn việc phục vụ khách)
  const warmTimer = setTimeout(() => {
    readJson('products.json').then((list) => warmThumbnails(list)).catch(() => {});
  }, 5000);
  warmTimer.unref?.();
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());

export default app;
