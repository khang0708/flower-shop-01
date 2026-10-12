// tests/products-api-test.js
// Chạy server thật với thư mục dữ liệu tạm: xóa sản phẩm, quyền admin, và file products.json bị hỏng.
import assert from 'assert';
import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
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

async function startServer(port, products, extraEnv = {}) {
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
      DEV_ALERT_TELEGRAM_CHAT_ID: '',
      ...extraEnv
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

  // ----- Ảnh sản phẩm: danh sách chỉ trả đường dẫn, ảnh phục vụ riêng -----
  const PNG_1PX = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const bigBytes = crypto.randomBytes(3 * 1024 * 1024);
  const bigUri = 'data:image/jpeg;base64,' + bigBytes.toString('base64');
  const svgUri = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString('base64');
  const img = await startServer(3193, [
    { id: 'BIG', name: 'Ảnh lớn', price: 1, image: bigUri, updatedAt: '2026-10-01T00:00:00.000Z' },
    { id: 'TINY', name: 'Ảnh nhỏ', price: 1, image: 'data:image/png;base64,' + PNG_1PX },
    { id: 'LINK', name: 'Ảnh link', price: 1, image: 'https://images.unsplash.com/photo-1?w=800' },
    { id: 'LOCAL', name: 'Ảnh tĩnh', price: 1, image: '/products/a.jpg' },
    { id: 'SVG', name: 'Ảnh svg', price: 1, image: svgUri },
    { id: 'HTML', name: 'Không phải ảnh', price: 1, image: 'data:text/html;base64,' + Buffer.from('<script>1</script>').toString('base64') }
  ]);
  const imgAuth = { Authorization: `Bearer ${await adminToken(img.base)}`, 'Content-Type': 'application/json' };
  const getList = async () => (await (await fetch(`${img.base}/api/products`)).json()).data;
  const byId = (list, id) => list.find((x) => x.id === id);
  const fetchImage = (url) => fetch(`${img.base}${url}`);

  await test('Danh sách thay ảnh data URI bằng đường dẫn nhỏ; ảnh link và ảnh tĩnh giữ nguyên', async () => {
    const raw = await (await fetch(`${img.base}/api/products`)).text();
    assert.ok(raw.length < 20000, `danh sách phải nhỏ, thực tế ${raw.length} byte`);
    assert.ok(!raw.includes('base64,'), 'không được còn data URI trong danh sách');
    const list = JSON.parse(raw).data;
    assert.match(byId(list, 'BIG').image, /^\/api\/products\/BIG\/image\?v=[0-9a-f]{12}$/);
    assert.match(byId(list, 'TINY').image, /^\/api\/products\/TINY\/image\?v=/);
    assert.strictEqual(byId(list, 'LINK').image, 'https://images.unsplash.com/photo-1?w=800');
    assert.strictEqual(byId(list, 'LOCAL').image, '/products/a.jpg');
  });

  await test('GET ảnh trả đúng từng byte, đúng loại, cache vô thời hạn khi có ?v=', async () => {
    const url = byId(await getList(), 'BIG').image;
    const r = await fetchImage(url);
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.headers.get('content-type'), 'image/jpeg');
    assert.match(r.headers.get('cache-control') || '', /immutable/);
    assert.match(r.headers.get('cache-control') || '', /max-age=31536000/);
    assert.strictEqual(r.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(Buffer.compare(Buffer.from(await r.arrayBuffer()), bigBytes), 0);
    const noV = await fetchImage('/api/products/BIG/image');
    assert.doesNotMatch(noV.headers.get('cache-control') || '', /immutable/);
  });

  await test('ETag: gửi lại If-None-Match thì trả 304 (không tải lại ảnh)', async () => {
    const url = byId(await getList(), 'BIG').image;
    const first = await fetchImage(url);
    const etag = first.headers.get('etag');
    assert.ok(etag, 'phải có ETag');
    await first.arrayBuffer();
    // fetch() của Node tự đổi 304 thành 200 khi bị gắn If-None-Match thủ công, nên dùng http để kiểm tra đúng server
    const status = await new Promise((resolve, reject) => {
      http.get(`${img.base}${url}`, { headers: { 'If-None-Match': etag } }, (res) => { res.resume(); resolve(res.statusCode); }).on('error', reject);
    });
    assert.strictEqual(status, 304);
  });

  await test('Sản phẩm không có ảnh tải lên / không tồn tại / data URI không phải ảnh -> 404', async () => {
    for (const id of ['LINK', 'LOCAL', 'KHONG-CO', 'HTML']) {
      assert.strictEqual((await fetchImage(`/api/products/${id}/image?v=1`)).status, 404, id);
    }
  });

  await test('Ảnh SVG được phục vụ trong sandbox (không chạy được script)', async () => {
    const r = await fetchImage(byId(await getList(), 'SVG').image);
    assert.strictEqual(r.headers.get('content-type'), 'image/svg+xml');
    assert.match(r.headers.get('content-security-policy') || '', /sandbox/);
  });

  await test('PUT gửi lại đường dẫn ảnh cũ + sửa tên: ảnh thật KHÔNG bị ghi đè, phiên bản ảnh không đổi', async () => {
    const before = byId(await getList(), 'BIG');
    const r = await fetch(`${img.base}/api/products/BIG`, {
      method: 'PUT', headers: imgAuth, body: JSON.stringify({ ...before, name: 'Đã đổi tên', updatedAt: new Date().toISOString() })
    });
    assert.strictEqual(r.status, 200);
    const res = (await r.json()).data;
    assert.strictEqual(res.image, before.image, 'phản hồi PUT cũng phải là đường dẫn ảnh, không phải data URI');
    const after = byId(await getList(), 'BIG');
    assert.strictEqual(after.name, 'Đã đổi tên');
    assert.strictEqual(after.image, before.image, 'đổi tên không được đổi phiên bản ảnh (tránh tải lại ảnh nặng)');
    assert.strictEqual(Buffer.compare(Buffer.from(await (await fetchImage(after.image)).arrayBuffer()), bigBytes), 0);
  });

  await test('PATCH ẩn/hiện: phản hồi không chứa data URI và phiên bản ảnh không đổi', async () => {
    const before = byId(await getList(), 'BIG').image;
    const r = await fetch(`${img.base}/api/products/BIG/toggle`, { method: 'PATCH', headers: imgAuth });
    assert.strictEqual(r.status, 200);
    assert.strictEqual((await r.json()).data.image, before);
    assert.strictEqual(byId(await getList(), 'BIG').image, before);
  });

  await test('PUT ảnh data URI mới: ảnh được thay và phiên bản đổi', async () => {
    const before = byId(await getList(), 'TINY').image;
    const newBytes = crypto.randomBytes(2048);
    const r = await fetch(`${img.base}/api/products/TINY`, {
      method: 'PUT', headers: imgAuth, body: JSON.stringify({ image: 'data:image/png;base64,' + newBytes.toString('base64') })
    });
    assert.strictEqual(r.status, 200);
    const after = byId(await getList(), 'TINY').image;
    assert.notStrictEqual(after, before);
    assert.strictEqual(Buffer.compare(Buffer.from(await (await fetchImage(after)).arrayBuffer()), newBytes), 0);
  });

  await test('POST sản phẩm có ảnh data URI: phản hồi trả đường dẫn và ảnh tải về đúng', async () => {
    const bytes = crypto.randomBytes(4096);
    const r = await fetch(`${img.base}/api/products`, {
      method: 'POST', headers: imgAuth,
      body: JSON.stringify({ id: 'NEW1', name: 'Mới', price: 5, image: 'data:image/webp;base64,' + bytes.toString('base64') })
    });
    assert.strictEqual(r.status, 201);
    const created = (await r.json()).data;
    assert.match(created.image, /^\/api\/products\/NEW1\/image\?v=/);
    const got = await fetchImage(created.image);
    assert.strictEqual(got.headers.get('content-type'), 'image/webp');
    assert.strictEqual(Buffer.compare(Buffer.from(await got.arrayBuffer()), bytes), 0);
  });

  await test('Admin gỡ ảnh (image rỗng): danh sách trả rỗng và route ảnh trả 404', async () => {
    const r = await fetch(`${img.base}/api/products/NEW1`, { method: 'PUT', headers: imgAuth, body: JSON.stringify({ image: '' }) });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(byId(await getList(), 'NEW1').image, '');
    assert.strictEqual((await fetchImage('/api/products/NEW1/image?v=x')).status, 404);
  });

  await test('Client gửi đường dẫn ảnh của sản phẩm chưa tồn tại: không lưu đường dẫn đó làm ảnh', async () => {
    const r = await fetch(`${img.base}/api/products/GHOST2`, {
      method: 'PUT', headers: imgAuth, body: JSON.stringify({ name: 'Ma', image: '/api/products/GHOST2/image?v=abc' })
    });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(byId(await getList(), 'GHOST2').image, '');
  });

  // ----- Ảnh thu nhỏ (?w=) -----
  const sharp = (await import('sharp')).default;
  const svgArt = (w, h) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#fdf2f4"/><circle cx="${w / 2}" cy="${h / 2}" r="${h / 3}" fill="#e8998d"/><rect x="20" y="20" width="${w / 4}" height="${h / 6}" fill="#1b3b2b"/></svg>`);
  // 1800x1200 (ngang) gắn EXIF orientation=6 => hiển thị thật là ảnh DỌC 1200x1800
  const photoJpeg = await sharp(svgArt(1800, 1200)).jpeg({ quality: 98, chromaSubsampling: '4:4:4' }).withMetadata({ orientation: 6 }).toBuffer();
  const smallPng = await sharp(svgArt(100, 80)).png().toBuffer();
  const gifBytes = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  const badBytes = crypto.randomBytes(5000);
  const uri = (mime, buf) => `data:${mime};base64,${buf.toString('base64')}`;

  const th = await startServer(3194, [
    { id: 'PHOTO', name: 'Ảnh chụp', price: 1, image: uri('image/jpeg', photoJpeg) },
    { id: 'SMALL', name: 'Ảnh nhỏ', price: 1, image: uri('image/png', smallPng) },
    { id: 'GIF1', name: 'Gif', price: 1, image: uri('image/gif', gifBytes) },
    { id: 'SVG1', name: 'Svg', price: 1, image: uri('image/svg+xml', svgArt(50, 50)) },
    { id: 'BAD', name: 'Ảnh hỏng', price: 1, image: uri('image/jpeg', badBytes) },
    { id: '../evil', name: 'Id nguy hiểm', price: 1, image: uri('image/jpeg', photoJpeg) }
  ]);
  const thAuth = { Authorization: `Bearer ${await adminToken(th.base)}`, 'Content-Type': 'application/json' };
  const cacheDir = path.join(th.dir, 'image-cache');
  const cacheFiles = () => (fs.existsSync(cacheDir) ? fs.readdirSync(cacheDir) : []);
  const thList = async () => (await (await fetch(`${th.base}/api/products`)).json()).data;
  const thUrl = async (id) => (await thList()).find((p) => p.id === id).image;
  const getBuf = async (url, headers = {}) => {
    const r = await fetch(`${th.base}${url}`, { headers });
    return { r, buf: Buffer.from(await r.arrayBuffer()) };
  };
  const WEBP = { Accept: 'image/avif,image/webp,image/*,*/*;q=0.8' };

  await test('?w=800 + Accept webp: trả WebP rộng 800, nhỏ hơn ảnh gốc, cache vô thời hạn, Vary: Accept', async () => {
    const { r, buf } = await getBuf(`${await thUrl('PHOTO')}&w=800`, WEBP);
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.headers.get('content-type'), 'image/webp');
    assert.match(r.headers.get('cache-control') || '', /immutable/);
    assert.match(r.headers.get('vary') || '', /Accept/i);
    const meta = await sharp(buf).metadata();
    assert.strictEqual(meta.width, 800);
    assert.ok(buf.length < photoJpeg.length / 2, `ảnh thu nhỏ ${buf.length} phải nhỏ hơn nửa ảnh gốc ${photoJpeg.length}`);
  });

  await test('Trình duyệt không hỗ trợ WebP (Accept không có webp): trả JPEG', async () => {
    const { r, buf } = await getBuf(`${await thUrl('PHOTO')}&w=480`, { Accept: 'image/png,image/*;q=0.8' });
    assert.strictEqual(r.headers.get('content-type'), 'image/jpeg');
    assert.strictEqual((await sharp(buf).metadata()).width, 480);
  });

  await test('Áp dụng hướng xoay EXIF (ảnh chụp điện thoại) và KHÔNG giữ EXIF/GPS trong ảnh thu nhỏ', async () => {
    const { buf } = await getBuf(`${await thUrl('PHOTO')}&w=800`, WEBP);
    const meta = await sharp(buf).metadata();
    assert.ok(meta.height > meta.width, `ảnh phải dọc sau khi xoay: ${meta.width}x${meta.height}`);
    assert.strictEqual(meta.height, 1200);
    assert.strictEqual(meta.exif, undefined);
    const jpg = await getBuf(`${await thUrl('PHOTO')}&w=800`, { Accept: 'image/png' });
    assert.strictEqual((await sharp(jpg.buf).metadata()).exif, undefined);
  });

  await test('Ảnh thu nhỏ có ETag và trả 304 khi gửi lại If-None-Match', async () => {
    const url = `${await thUrl('PHOTO')}&w=800`;
    const first = await fetch(`${th.base}${url}`, { headers: WEBP });
    const etag = first.headers.get('etag');
    assert.ok(etag, 'phải có ETag');
    await first.arrayBuffer();
    const status = await new Promise((resolve, reject) => {
      http.get(`${th.base}${url}`, { headers: { ...WEBP, 'If-None-Match': etag } }, (res) => { res.resume(); resolve(res.statusCode); }).on('error', reject);
    });
    assert.strictEqual(status, 304);
  });

  await test('Ảnh nhỏ hơn cỡ yêu cầu không bị phóng to', async () => {
    const { buf } = await getBuf(`${await thUrl('SMALL')}&w=800`, WEBP);
    assert.strictEqual((await sharp(buf).metadata()).width, 100);
  });

  await test('Cỡ không nằm trong danh sách cho phép (w=7, 5000, abc) -> trả ảnh gốc, không tạo file cache', async () => {
    const before = cacheFiles().length;
    for (const w of ['7', '5000', 'abc', '-1']) {
      const { r, buf } = await getBuf(`${await thUrl('PHOTO')}&w=${w}`, WEBP);
      assert.strictEqual(r.status, 200, `w=${w}`);
      assert.strictEqual(r.headers.get('content-type'), 'image/jpeg');
      assert.strictEqual(Buffer.compare(buf, photoJpeg), 0, `w=${w} phải trả đúng ảnh gốc`);
    }
    assert.strictEqual(cacheFiles().length, before);
  });

  await test('GIF và SVG có ?w= -> vẫn trả ảnh gốc (không thu nhỏ)', async () => {
    const gif = await getBuf(`${await thUrl('GIF1')}&w=480`, WEBP);
    assert.strictEqual(gif.r.headers.get('content-type'), 'image/gif');
    assert.strictEqual(Buffer.compare(gif.buf, gifBytes), 0);
    const svg = await getBuf(`${await thUrl('SVG1')}&w=480`, WEBP);
    assert.strictEqual(svg.r.headers.get('content-type'), 'image/svg+xml');
  });

  await test('Ảnh hỏng không làm sập API: ?w= tự trả ảnh gốc (200), không phải 500', async () => {
    const { r, buf } = await getBuf(`${await thUrl('BAD')}&w=800`, WEBP);
    assert.strictEqual(r.status, 200);
    assert.strictEqual(Buffer.compare(buf, badBytes), 0);
  });

  await test('Id sản phẩm chứa ký tự nguy hiểm không ghi được file ra ngoài thư mục cache', async () => {
    const url = (await thList()).find((p) => p.id === '../evil').image;
    const r = await fetch(`${th.base}${url}&w=480`, { headers: WEBP });
    assert.strictEqual(r.status, 200);
    await r.arrayBuffer();
    assert.ok(cacheFiles().some((f) => f.startsWith('___evil-')), 'file cache phải nằm trong image-cache với tên đã làm sạch');
    assert.ok(!fs.readdirSync(th.dir).some((f) => f.includes('evil')), 'không được tạo file ngoài thư mục cache');
    assert.ok(!fs.readdirSync(path.dirname(th.dir)).some((f) => f === 'evil' || f.startsWith('evil__')));
  });

  await test('Tải ảnh mới lên: ảnh thu nhỏ cũ bị dọn, bản mới được tạo sẵn ở nền', async () => {
    const oldFiles = cacheFiles().filter((f) => f.startsWith('PHOTO-'));
    assert.ok(oldFiles.length >= 2, 'phải có ảnh thu nhỏ của bản cũ');
    const newPhoto = await sharp(svgArt(1500, 1000)).jpeg({ quality: 90 }).toBuffer();
    const r = await fetch(`${th.base}/api/products/PHOTO`, { method: 'PUT', headers: thAuth, body: JSON.stringify({ image: uri('image/jpeg', newPhoto) }) });
    assert.strictEqual(r.status, 200);
    let fresh = [];
    for (let i = 0; i < 40 && fresh.length < 2; i++) {
      await new Promise((res) => setTimeout(res, 150));
      fresh = cacheFiles().filter((f) => f.startsWith('PHOTO-') && !oldFiles.includes(f));
    }
    assert.ok(fresh.length >= 2, 'ảnh thu nhỏ bản mới phải được tạo sẵn (480 và 800)');
    assert.ok(cacheFiles().filter((f) => oldFiles.includes(f)).length === 0, 'ảnh thu nhỏ của bản cũ phải bị xóa');
    const { buf } = await getBuf(`${await thUrl('PHOTO')}&w=800`, WEBP);
    assert.strictEqual((await sharp(buf).metadata()).width, 800);
  });

  await test('Thêm sản phẩm mới có ảnh: ảnh thu nhỏ được tạo sẵn; xóa sản phẩm thì dọn sạch cache của nó', async () => {
    const pic = await sharp(svgArt(1200, 900)).jpeg({ quality: 90 }).toBuffer();
    const r = await fetch(`${th.base}/api/products`, { method: 'POST', headers: thAuth, body: JSON.stringify({ id: 'WARM1', name: 'Tạo sẵn', price: 1, image: uri('image/jpeg', pic) }) });
    assert.strictEqual(r.status, 201);
    let mine = [];
    for (let i = 0; i < 40 && mine.length < 2; i++) {
      await new Promise((res) => setTimeout(res, 150));
      mine = cacheFiles().filter((f) => f.startsWith('WARM1-'));
    }
    assert.ok(mine.length >= 2, 'phải có ảnh 480 và 800 tạo sẵn');
    assert.strictEqual((await fetch(`${th.base}/api/products/WARM1`, { method: 'DELETE', headers: thAuth })).status, 200);
    assert.strictEqual(cacheFiles().filter((f) => f.startsWith('WARM1-')).length, 0);
  });

  const off = await startServer(3195, [{ id: 'PHOTO', name: 'Ảnh', price: 1, image: uri('image/jpeg', photoJpeg) }], { IMAGE_THUMBNAILS: 'off' });
  await test('Công tắc IMAGE_THUMBNAILS=off: ?w= trả ảnh gốc và không tạo thư mục cache', async () => {
    const url = (await (await fetch(`${off.base}/api/products`)).json()).data[0].image;
    const r = await fetch(`${off.base}${url}&w=800`, { headers: WEBP });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.headers.get('content-type'), 'image/jpeg');
    assert.strictEqual(Buffer.compare(Buffer.from(await r.arrayBuffer()), photoJpeg), 0);
    assert.ok(!fs.existsSync(path.join(off.dir, 'image-cache')));
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
