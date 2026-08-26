# 🌸 FLORA & BLOOM ATELIER - DEV LOG & CHUYỂN GIAO NGỮ CẢNH

Tài liệu này lưu trữ tiến độ phát triển, kiến trúc hệ thống và trạng thái các Milestone của dự án để đảm bảo không bị mất ngữ cảnh khi mở phiên làm việc mới.

---

## 🗺️ BẢNG TIẾN ĐỘ LỘ TRÌNH (ROADMAP PROGRESS)

| Chặng | Tên Tính Năng | Trạng Thái | Git Commit Mốc |
| :--- | :--- | :---: | :--- |
| **Chặng 1** | In Hóa Đơn, Phiếu Giao Hàng & Thiệp Cắm Hoa | ✅ **HOÀN TẤT** | `7a15732` - `feat(orders): chặng 1 - thêm chức năng in hóa đơn...` |
| **Chặng 2** | Hệ Thống Mã Giảm Giá & Voucher Khuyến Mãi | ✅ **HOÀN TẤT** | `af7a028` - `feat(promo): chặng 2 - tích hợp hệ thống voucher...` |
| **Chặng 3** | Báo Cáo & Biểu Đồ Doanh Thu | ⏳ **TIẾP THEO** | *Đang chuẩn bị triển khai* |
| **Chặng 4** | Đánh Giá & Feedback Thực Tế Từ Khách Hàng | ⏹️ Chưa bắt đầu | - |

---

## 📌 CHI TIẾT CÁC TÍNH NĂNG ĐÃ HOÀN THÀNH:

### ✅ Chặng 1: In Hóa Đơn, Phiếu Giao & Thiệp Nghệ Thuật
* **Files:** `src/components/PrintInvoiceModal.jsx`, `src/components/AdminDashboard.jsx`.
* **Chức Năng:** In phiếu giao hoa chuẩn xưởng và thiệp chúc nghệ thuật chuẩn `@media print`.

### ✅ Chặng 2: Hệ Thống Mã Giảm Giá Voucher & Quản Trị Khuyến Mãi
* **Files:** 
  * `server/data/discounts.json`, `vite.config.js` (`/api/discounts`, `/api/discounts/validate`).
  * `src/api/index.js`, `src/context/ShopContext.jsx`.
  * `src/components/CartDrawer.jsx`, `src/components/CheckoutModal.jsx`.
  * `src/components/AdminDashboard.jsx` (Tab 🎟️ Quản Lý Voucher & Modal tạo mã).
* **Chức Năng:**
  * Hỗ trợ 3 kiểu giảm giá: `%` (kèm trần tối đa), `Số tiền cố định (đ)`, `Freeship (35k)`.
  * Ràng buộc đơn tối thiểu, số lượt dùng tối đa, hạn sử dụng.
  * Tự động trừ tiền và lưu mã giảm giá vào đơn hàng.
* **Xác Thực:** Build thành công 100%, Commit Git `af7a028`.

---

## 🚀 TIẾP THEO: CHẶNG 3 (Báo Cáo & Biểu Đồ Doanh Thu)
* **Mục Tiêu:**
  1. Thống kê KPI tổng quan: Doanh thu thực tế, Số đơn thành công, Giá trị trung bình/đơn (AOV).
  2. Biểu đồ doanh thu trực quan theo ngày/tuần.
  3. Bảng xếp hạng Top mẫu hoa bán chạy nhất (Best Sellers).

