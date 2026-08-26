import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'server', 'data');

console.log('====================================================');
console.log('🧪 BẮT ĐẦU CHUỖI KIỂM THỬ ĐƠN VỊ & NGHIỆP VỤ SHOP');
console.log('====================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedTests++;
  }
}

// 1. Dữ liệu JSON
const requiredFiles = ['products.json', 'orders.json', 'discounts.json', 'reviews.json', 'inventory.json', 'settings.json'];
requiredFiles.forEach(file => {
  const filePath = path.join(DATA_DIR, file);
  assert(fs.existsSync(filePath), `File ${file} tồn tại`);
});

// 2. Discount validation
const discounts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'discounts.json'), 'utf-8'));
function validateCoupon(code, cartTotal, discountList) {
  const match = discountList.find(d => d.code === code && d.isActive);
  if (!match) return { valid: false };
  if (cartTotal < (match.minOrderValue || 0)) return { valid: false };
  let amount = 0;
  if (match.type === 'percentage') {
    amount = Math.round((cartTotal * match.value) / 100);
    if (match.maxDiscount && amount > match.maxDiscount) amount = match.maxDiscount;
  } else if (match.type === 'fixed') {
    amount = Math.min(match.value, cartTotal);
  } else if (match.type === 'shipping') {
    amount = match.value || 35000;
  }
  return { valid: true, discountAmount: amount };
}

assert(validateCoupon('FLORA10', 850000, discounts).discountAmount === 85000, 'FLORA10 chiết khấu đúng 10%');
assert(validateCoupon('FREESHIP', 500000, discounts).discountAmount === 35000, 'FREESHIP giảm đúng 35.000đ');

// 3. Analytics
const orders = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'orders.json'), 'utf-8'));
assert(orders.length > 0, `Có ${orders.length} đơn hàng được đồng bộ`);

// 4. Reviews
const reviews = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'reviews.json'), 'utf-8'));
assert(reviews.length > 0, `Có ${reviews.length} đánh giá khách hàng`);

console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passedTests} ĐẠT / ${passedTests + failedTests} BÀI TEST`);
console.log('====================================================');
