// server/auth.js
// Module bảo mật xác thực Admin (PBKDF2 Salted Hashing & JWT HMAC-SHA256 Token)
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

// Secret key dùng để ký JWT - lấy từ biến môi trường hoặc cố định an toàn
export const JWT_SECRET = process.env.JWT_SECRET || 'flora_bloom_atelier_secure_jwt_secret_2026_buon_ma_thuot';

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
  const defaultPass = process.env.ADMIN_DEFAULT_PASSWORD || 'Flora@2026';
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
