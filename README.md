# 🌸 Flora & Bloom - Tiệm Hoa Tươi Nghệ Thuật (hoatuoibmt.vn)

[![CI/CD Auto Deploy to AZDIGI VPS](https://github.com/khang0708/flower-shop-01/actions/workflows/deploy.yml/badge.svg)](https://github.com/khang0708/flower-shop-01/actions/workflows/deploy.yml)

Website bán lẻ hoa tươi nghệ thuật, giỏ trái cây cao cấp và dịch vụ hoa cưới hỏi chuyên nghiệp tại Buôn Ma Thuột.

- **🌐 Website chính thức:** [https://hoatuoibmt.vn](https://hoatuoibmt.vn)
- **⚡ Công nghệ sử dụng:** React 19, Vite, Tailwind CSS, Node.js Express, PM2, Nginx, Let's Encrypt SSL.
- **🚀 Triển khai & Vận hành:** VPS AZDIGI (Debian 13) với quy trình CI/CD tự động qua GitHub Actions.

---

## 🛠️ Hướng Dẫn Phát Triển Cục Bộ (Local Development)

### Yêu cầu môi trường:
- Node.js >= 20.x
- npm >= 10.x

### Cài đặt và khởi chạy:
```bash
# Cài đặt thư viện phụ thuộc
npm install

# Khởi chạy Dev Server
npm run dev
```

### Chạy bộ kiểm thử (Test Suite):
```bash
npm test
```

---

## 🚀 Quy Trình CI/CD Tự Động (GitHub Actions)
Hệ thống tự động kích hoạt mỗi khi có commit được đẩy lên nhánh `main`:
1. **Automated Test:** Chạy bộ kiểm thử toàn diện 34 unit tests & 22 tiêu chuẩn bảo mật.
2. **Auto Deploy:** Kết nối SSH bảo mật vào VPS AZDIGI, tự động build và reload dịch vụ (Zero Downtime).
