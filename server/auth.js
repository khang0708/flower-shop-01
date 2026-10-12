// server/auth.js
// Module bảo mật xác thực Admin (PBKDF2 Salted Hashing & JWT HMAC-SHA256 Token)
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Nạp .env TRƯỚC khi đọc JWT_SECRET: import ES được chạy trước mọi lệnh trong server.js,
// nên nếu không nạp ở đây JWT_SECRET trong .env sẽ không bao giờ được thấy.
dotenv.config();
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

// Secret key dùng để ký JWT - BẮT BUỘC đặt qua biến môi trường JWT_SECRET (openssl rand -hex 48).
// Không có giá trị mặc định công khai: nếu thiếu, tạo secret ngẫu nhiên cho tiến trình này
// (mọi phiên đăng nhập sẽ mất khi khởi động lại) và cảnh báo rõ ràng.
const MIN_JWT_SECRET_LENGTH = 32;
function resolveJwtSecret() {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length >= MIN_JWT_SECRET_LENGTH) return fromEnv;
  console.warn(
    fromEnv
      ? `⚠️ [Bảo mật] JWT_SECRET quá ngắn (<${MIN_JWT_SECRET_LENGTH} ký tự) - dùng secret ngẫu nhiên tạm thời.`
      : '⚠️ [Bảo mật] Chưa đặt JWT_SECRET trong .env - dùng secret ngẫu nhiên tạm thời (phiên đăng nhập mất khi restart). Tạo bằng: openssl rand -hex 48'
  );
  return crypto.randomBytes(48).toString('hex');
}
export const JWT_SECRET = resolveJwtSecret();

// ----------------------------------------------------
// 1. PBKDF2 Password Hashing & Timing-Safe Verification
// ----------------------------------------------------
export function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(String(password), salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, storedHash, storedSalt) {
  if (!password || !storedHash || !storedSalt) return false;
  try {
    const computedHash = crypto.pbkdf2Sync(String(password), storedSalt, 10000, 64, 'sha512').toString('hex');
    const a = Buffer.from(computedHash, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

// ----------------------------------------------------
// 2. JWT Generation & Verification (HMAC-SHA256)
// ----------------------------------------------------
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

export function createJwtToken(payload, secret = JWT_SECRET, expiresInMs = 7 * 24 * 3600 * 1000) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + expiresInMs
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwtToken(token, secret = JWT_SECRET) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  try {
    const sigA = Buffer.from(signature);
    const sigB = Buffer.from(expectedSignature);
    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Token expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// ----------------------------------------------------
// 3. Admin Account Storage Management (File + Neon DB)
// ----------------------------------------------------
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// Khởi tạo tài khoản Admin mặc định nếu chưa tồn tại
export function getInitialAdminCredentials() {
  const defaultUser = process.env.ADMIN_USERNAME || 'admin';
  let defaultPass = process.env.ADMIN_DEFAULT_PASSWORD;
  if (!defaultPass) {
    // Không dùng mật khẩu mặc định công khai: sinh ngẫu nhiên và in ra log đúng một lần
    defaultPass = crypto.randomBytes(9).toString('base64url');
    console.warn(`⚠️ [Bảo mật] Chưa đặt ADMIN_DEFAULT_PASSWORD. Mật khẩu admin khởi tạo (đổi ngay sau khi đăng nhập): ${defaultPass}`);
  }
  const { hash, salt } = hashPassword(defaultPass);
  return {
    username: defaultUser,
    name: 'Quản Trị Viên Ngọc Flower',
    hash,
    salt,
    role: 'SUPER_ADMIN',
    updatedAt: new Date().toISOString()
  };
}

export function readAdminConfig(readJsonFn = null) {
  if (fs.existsSync(ADMIN_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf-8'));
      if (data && data.hash && data.salt) return data;
    } catch (e) {}
  }
  
  // Nếu chưa có, tạo mặc định
  const initial = getInitialAdminCredentials();
  saveAdminConfig(initial);
  return initial;
}

export function saveAdminConfig(adminData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(adminData, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.warn('Lỗi lưu admin.json:', e.message);
    return false;
  }
}

// ----------------------------------------------------
// 4. Rate Limiter chống Brute-Force đăng nhập
// ----------------------------------------------------
const loginAttempts = new Map(); // IP -> { count, lockedUntil }

export function checkLoginRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      message: `Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau ${remainingSeconds} giây.`
    };
  }

  if (record.lockedUntil && now >= record.lockedUntil) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + 5 * 60 * 1000; // Khóa 5 phút
  }
  loginAttempts.set(ip, record);
}

export function clearFailedLogin(ip) {
  loginAttempts.delete(ip);
}

// ----------------------------------------------------
// 4b. Vé SSE ngắn hạn (EventSource không gửi được header Authorization)
// ----------------------------------------------------
const sseTickets = new Map(); // ticket -> expiresAt
const SSE_TICKET_TTL_MS = 60 * 1000;

export function issueSseTicket() {
  const now = Date.now();
  for (const [t, exp] of sseTickets) if (exp <= now) sseTickets.delete(t);
  const ticket = crypto.randomBytes(24).toString('hex');
  sseTickets.set(ticket, now + SSE_TICKET_TTL_MS);
  return ticket;
}

// Dùng một lần: hợp lệ thì xóa ngay
export function consumeSseTicket(ticket) {
  if (!ticket || typeof ticket !== 'string') return false;
  const exp = sseTickets.get(ticket);
  sseTickets.delete(ticket);
  return Boolean(exp && exp > Date.now());
}

// ----------------------------------------------------
// 5. Express Middleware xác thực quyền Admin
// ----------------------------------------------------
export function requireAdminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Yêu cầu đăng nhập quản trị viên để thực hiện thao tác này.'
    });
  }

  const token = authHeader.slice(7).trim();
  const decoded = verifyJwtToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
    });
  }

  req.adminUser = decoded;
  next();
}
