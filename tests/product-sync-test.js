// tests/product-sync-test.js
// Máy chủ là nguồn sự thật cho danh sách sản phẩm: kiểm thử hàm gộp cache local với dữ liệu server.
import assert from 'assert';

const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

const {
  mergeProductsWithConflictResolution: merge,
  markProductDeletedLocal,
  unmarkProductDeletedLocal,
  getDeletedProductIds,
  purgeLegacyDeletedMarks,
  RECENT_LOCAL_WINDOW_MS
} = await import('../src/utils/conflictResolution.js');

console.log('\n====================================================');
console.log('🔄 KIỂM THỬ ĐỒNG BỘ SẢN PHẨM: MÁY CHỦ LÀ NGUỒN SỰ THẬT');
console.log('====================================================\n');

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

const NOW = new Date('2026-10-11T10:00:00.000Z').getTime();
const iso = (msAgo) => new Date(NOW - msAgo).toISOString();
const ids = (list) => list.map((p) => p.id);

test('Cache còn sản phẩm đã bị xóa trên server -> bị loại', () => {
  const local = [
    { id: 'A', name: 'A', updatedAt: iso(86400000) },
    { id: 'DELETED', name: 'Đã xóa trên server', updatedAt: iso(86400000) }
  ];
  const server = [{ id: 'A', name: 'A', updatedAt: iso(86400000) }];
  assert.deepStrictEqual(ids(merge(local, server, { now: NOW })), ['A']);
});

test('Dữ liệu mẫu không có updatedAt mà server không có -> bị loại', () => {
  const seed = [{ id: 'S1', name: 'Mẫu 1' }, { id: 'S2', name: 'Mẫu 2' }];
  const server = [{ id: 'S2', name: 'Mẫu 2 (server)', updatedAt: iso(1000) }];
  const result = merge(seed, server, { now: NOW });
  assert.deepStrictEqual(ids(result), ['S2']);
  assert.strictEqual(result[0].name, 'Mẫu 2 (server)');
});

test('Server trả danh sách rỗng -> kết quả rỗng (không giữ lại cache cũ)', () => {
  const local = [{ id: 'A', updatedAt: iso(86400000) }, { id: 'S1' }];
  assert.deepStrictEqual(merge(local, [], { now: NOW }), []);
});

test('Sản phẩm vừa tạo trong 15 giây (chờ lưu) được giữ, đứng đầu danh sách', () => {
  const local = [
    { id: 'NEW', name: 'Vừa tạo', updatedAt: iso(5000) },
    { id: 'A', updatedAt: iso(86400000) }
  ];
  const server = [{ id: 'A', updatedAt: iso(86400000) }];
  assert.deepStrictEqual(ids(merge(local, server, { now: NOW })), ['NEW', 'A']);
});

test('Sản phẩm chỉ có ở local nhưng quá 15 giây -> bị loại', () => {
  const local = [{ id: 'OLD', updatedAt: iso(RECENT_LOCAL_WINDOW_MS + 1000) }];
  assert.deepStrictEqual(merge(local, [], { now: NOW }), []);
});

test('Sản phẩm local chỉ có createdAt (không updatedAt) vẫn được tính là vừa tạo', () => {
  const local = [{ id: 'NEW2', createdAt: iso(2000) }];
  assert.deepStrictEqual(ids(merge(local, [], { now: NOW })), ['NEW2']);
});

test('Cả hai bên đều có: bản local mới hơn hẳn thì thắng', () => {
  const local = [{ id: 'A', name: 'Local mới', updatedAt: iso(1000) }];
  const server = [{ id: 'A', name: 'Server cũ', updatedAt: iso(60000) }];
  assert.strictEqual(merge(local, server, { now: NOW })[0].name, 'Local mới');
});

test('Cả hai bên đều có: bản server mới hơn thì thắng', () => {
  const local = [{ id: 'A', name: 'Local cũ', updatedAt: iso(60000) }];
  const server = [{ id: 'A', name: 'Server mới', updatedAt: iso(1000) }];
  assert.strictEqual(merge(local, server, { now: NOW })[0].name, 'Server mới');
});

test('Cả hai bên đều có, updatedAt bằng nhau hoặc local không có -> server thắng', () => {
  const same = iso(5000);
  assert.strictEqual(
    merge([{ id: 'A', name: 'L', updatedAt: same }], [{ id: 'A', name: 'S', updatedAt: same }], { now: NOW })[0].name,
    'S'
  );
  assert.strictEqual(
    merge([{ id: 'A', name: 'L' }], [{ id: 'A', name: 'S', updatedAt: same }], { now: NOW })[0].name,
    'S'
  );
});

test('Sản phẩm mới chỉ có trên server được thêm vào; thứ tự server được giữ', () => {
  const server = [{ id: 'X' }, { id: 'Y' }, { id: 'Z' }];
  assert.deepStrictEqual(ids(merge([{ id: 'Y' }], server, { now: NOW })), ['X', 'Y', 'Z']);
});

test('Không trùng id khi server có id lặp hoặc local trùng bản server', () => {
  const server = [{ id: 'A' }, { id: 'A' }];
  const local = [{ id: 'A', updatedAt: iso(1000) }, { id: 'A', updatedAt: iso(1000) }];
  assert.strictEqual(merge(local, server, { now: NOW }).length, 1);
});

test('Đang chờ xóa: sản phẩm bị ẩn dù server còn trả về', () => {
  const server = [{ id: 'A' }, { id: 'B' }];
  markProductDeletedLocal('B');
  assert.deepStrictEqual(ids(merge([], server, { now: NOW })), ['A']);
  assert.ok(getDeletedProductIds().has('B'));
  unmarkProductDeletedLocal('B');
});

test('Đang chờ xóa rồi xóa THẤT BẠI (bỏ dấu ẩn) -> sản phẩm hiện lại từ server', () => {
  const server = [{ id: 'A' }, { id: 'B', name: 'Vẫn còn trên server' }];
  markProductDeletedLocal('B');
  assert.deepStrictEqual(ids(merge([{ id: 'A' }], server, { now: NOW })), ['A']);
  unmarkProductDeletedLocal('B'); // xóa thất bại -> bỏ dấu ẩn
  assert.deepStrictEqual(ids(merge([{ id: 'A' }], server, { now: NOW })), ['A', 'B']);
  assert.strictEqual(getDeletedProductIds().size, 0);
});

test('Xóa THÀNH CÔNG: server không còn sản phẩm -> không hiện lại dù cache còn', () => {
  const local = [{ id: 'A', updatedAt: iso(86400000) }, { id: 'B', updatedAt: iso(86400000) }];
  const serverAfterDelete = [{ id: 'A', updatedAt: iso(86400000) }];
  markProductDeletedLocal('B');
  unmarkProductDeletedLocal('B'); // đã bỏ dấu ẩn sau khi xóa xong
  assert.deepStrictEqual(ids(merge(local, serverAfterDelete, { now: NOW })), ['A']);
});

test('Dấu đã xóa kiểu cũ trong localStorage bị dọn, không còn ảnh hưởng', () => {
  mockStorage.set('flora_deleted_product_ids', JSON.stringify(['A']));
  purgeLegacyDeletedMarks();
  assert.strictEqual(mockStorage.has('flora_deleted_product_ids'), false);
  assert.deepStrictEqual(ids(merge([], [{ id: 'A' }], { now: NOW })), ['A']);
});

test('Đầu vào không hợp lệ (null/undefined/phần tử rỗng) không làm hỏng hàm gộp', () => {
  assert.deepStrictEqual(merge(null, null, { now: NOW }), []);
  assert.deepStrictEqual(ids(merge([null, {}], [null, { id: 'A' }, {}], { now: NOW })), ['A']);
});

console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ ĐỒNG BỘ SẢN PHẨM: ${passed} ĐẠT / ${passed + failed} BÀI TEST`);
console.log('====================================================\n');

if (failed > 0) process.exit(1);
