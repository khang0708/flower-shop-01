// tests/products-api-test.js
// Chạy server thật với thư mục dữ liệu tạm: xóa sản phẩm, quyền admin, và file products.json bị hỏng.
import assert from 'assert';
import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ADMIN_PASSWORD = `t-${crypto.randomBytes(9).toString('hex')}`;
const children = [];
const tempDirs = [];

console.log('\n====================================================');
console.log('🌐 KIỂM THỬ API SẢN PHẨM (SERVER THẬT, DỮ LIỆU TẠM)');
console.log('====================================================\n');

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

async function startServer(port, products) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flora-api-test-'));
  tempDirs.push(dir);
  fs.writeFileSync(path.join(dir, 'products.json'), typeof products === 'string' ? products : JSON.stringify(products));
  const child = spawn(process.execPath, ['server/server.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: dir,
      JWT_SECRET: 'products-api-test-secret',
      ADMIN_DEFAULT_PASSWORD: ADMIN_PASSWORD,
      DATABASE_URL: '',
      DEV_ALERT_TELEGRAM_TOKEN: '',
      DEV_ALERT_TELEGRAM_CHAT_ID: ''
    },
    stdio: 'ignore'
  });
  children.push(child);
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${base}/api/health`);
      if (r.ok) return { base, dir };
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Server không khởi động được');
}

async function adminToken(base) {
  const r = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: ADMIN_PASSWORD })
  });
  assert.strictEqual(r.status, 200, 'đăng nhập admin test phải thành công');
  return (await r.json()).token;
}

const list = async (base) => (await (await fetch(`${base}/api/products`)).json()).data.map((p) => p.id);

try {
  const a = await startServer(3191, [
    { id: 'P1', name: 'Một', price: 1 },
    { id: 'P2', name: 'Hai', price: 2 }
  ]);
  const token = await adminToken(a.base);
  const auth = { Authorization: `Bearer ${token}` };

  await test('GET /api/products trả đúng danh sách và không cho cache', async () => {
    const r = await fetch(`${a.base}/api/products`);
    assert.strictEqual(r.status, 200);
    assert.match(r.headers.get('cache-control') || '', /no-store/);
    assert.deepStrictEqual(await list(a.base), ['P1', 'P2']);
  });

  await test('DELETE không có token hoặc token sai -> 401 và sản phẩm còn nguyên', async () => {
    assert.strictEqual((await fetch(`${a.base}/api/products/P1`, { method: 'DELETE' })).status, 401);
    assert.strictEqual(
      (await fetch(`${a.base}/api/products/P1`, { method: 'DELETE', headers: { Authorization: 'Bearer a.b.c' } })).status,
      401
    );
    assert.deepStrictEqual(await list(a.base), ['P1', 'P2']);
  });

  await test('DELETE bằng admin -> 200 và danh sách chỉ còn sản phẩm khác', async () => {
    assert.strictEqual((await fetch(`${a.base}/api/products/P1`, { method: 'DELETE', headers: auth })).status, 200);
    assert.deepStrictEqual(await list(a.base), ['P2']);
  });

  await test('DELETE sản phẩm không tồn tại -> 404', async () => {
    assert.strictEqual((await fetch(`${a.base}/api/products/KHONG-CO`, { method: 'DELETE', headers: auth })).status, 404);
  });

  await test('Xóa hết sản phẩm -> server trả danh sách rỗng hợp lệ (200, [])', async () => {
    assert.strictEqual((await fetch(`${a.base}/api/products/P2`, { method: 'DELETE', headers: auth })).status, 200);
    const r = await fetch(`${a.base}/api/products`);
    assert.strictEqual(r.status, 200);
    assert.deepStrictEqual((await r.json()).data, []);
  });

  const broken = await startServer(3192, '{ day khong phai json');
  const brokenToken = await adminToken(broken.base);
  const brokenFile = path.join(broken.dir, 'products.json');

  await test('products.json hỏng -> GET trả 500 (không trả [] làm trống trang khách)', async () => {
    const r = await fetch(`${broken.base}/api/products`);
    assert.strictEqual(r.status, 500);
    assert.notStrictEqual(r.status, 200);
  });

  await test('products.json hỏng -> thêm sản phẩm bị từ chối và file KHÔNG bị ghi đè', async () => {
    const before = fs.readFileSync(brokenFile, 'utf8');
    const r = await fetch(`${broken.base}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${brokenToken}` },
      body: JSON.stringify({ id: 'X', name: 'X', price: 1 })
    });
    assert.strictEqual(r.status, 500);
    assert.strictEqual(fs.readFileSync(brokenFile, 'utf8'), before);
  });
} finally {
  children.forEach((c) => c.kill());
  await new Promise((r) => setTimeout(r, 300));
  tempDirs.forEach((d) => fs.rmSync(d, { recursive: true, force: true }));
}

console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ API SẢN PHẨM: ${passed} ĐẠT / ${passed + failed} BÀI TEST`);
console.log('====================================================\n');

if (failed > 0) process.exit(1);
