# 🌸 FLORA & BLOOM ATELIER - DEV LOG & CHUYỂN GIAO NGỮ CẢNH

Tài liệu này lưu trữ tiến độ phát triển, kiến trúc hệ thống và trạng thái các Milestone của dự án để đảm bảo không bị mất ngữ cảnh khi mở phiên làm việc mới.

---

## 🗺️ BẢNG TIẾN ĐỘ LỘ TRÌNH (ROADMAP PROGRESS)

| Chặng | Tên Tính Năng | Trạng Thái | Git Commit Mốc |
| :--- | :--- | :---: | :--- |
| **Chặng 1** | In Hóa Đơn, Phiếu Giao Hàng & Thiệp Cắm Hoa | ✅ **HOÀN TẤT** | `7a15732` - `feat(orders): chặng 1 - thêm chức năng in hóa đơn...` |
| **Chặng 2** | Hệ Thống Mã Giảm Giá & Voucher Khuyến Mãi | ✅ **HOÀN TẤT** | `af7a028` - `feat(promo): chặng 2 - tích hợp hệ thống voucher...` |
| **Chặng 3** | Báo Cáo & Biểu Đồ Doanh Thu | ✅ **HOÀN TẤT** | `0ecb2d8` - `feat(analytics): chặng 3 - tích hợp bảng điều khiển...` |
| **Chặng 4** | Đánh Giá & Feedback Thực Tế Từ Khách Hàng | ⏳ **TIẾP THEO** | *Đang chuẩn bị triển khai* |

---

## 📌 CHI TIẾT CÁC TÍNH NĂNG ĐÃ HOÀN THÀNH:

### ✅ Chặng 1: In Hóa Đơn, Phiếu Giao & Thiệp Nghệ Thuật
* **Files:** `src/components/PrintInvoiceModal.jsx`, `src/components/AdminDashboard.jsx`.
* **Chức Năng:** In phiếu giao hoa chuẩn xưởng và thiệp chúc nghệ thuật chuẩn `@media print`.

### ✅ Chặng 2: Hệ Thống Mã Giảm Giá Voucher & Quản Trị Khuyến Mãi
* **Files:** `server/data/discounts.json`, `vite.config.js`, `src/api/index.js`, `src/context/ShopContext.jsx`, `src/components/CartDrawer.jsx`, `src/components/CheckoutModal.jsx`, `src/components/AdminDashboard.jsx`.
* **Chức Năng:** Hỗ trợ voucher %, số tiền, freeship, ràng buộc đơn tối thiểu, số lượt dùng, tự động trừ tiền.

### ✅ Chặng 3: Báo Cáo & Biểu Đồ Doanh Thu
* **Files:** `src/components/SalesAnalyticsView.jsx`, `src/components/AdminDashboard.jsx`.
* **Chức Năng:**
  * 4 KPI tài chính/vận hành: Doanh thu thực tế, Tổng số đơn, AOV (Giá trị TB/đơn), Tỷ lệ hài lòng ảnh mẫu hoa.
  * Biểu đồ cột xu hướng doanh thu 7 ngày tương tác hover tooltip.
  * Phân bổ tỷ lệ các dịp tặng hoa (Tình yêu, Sinh nhật, Khai trương, Tri ân).
  * Bảng xếp hạng Top mẫu hoa bán chạy nhất (Best Sellers) kèm ảnh và số đơn bán.
* **Xác Thực:** Build thành công 100%, Commit Git `0ecb2d8`.

---

## 🚀 TIẾP THEO: CHẶNG 4 (Đánh Giá & Feedback Thực Tế Từ Khách Hàng)
* **Mục Tiêu:**
  1. Persistent store `server/data/reviews.json` và API `/api/reviews` (GET, POST gửi đánh giá mới).
  2. Modal/Form gửi đánh giá: Số sao (1-5 sao), Họ tên, Tag dịp tặng, Cảm nhận chất lượng hoa & shipper, Ảnh hoa thực tế nhận được.
  3. Hiển thị Section Đánh Giá & Feedback Thực Tế trên Storefront (`App.jsx` / `ProductDetailModal.jsx` / `ReviewsSection.jsx`).
  4. Quản lý / Ẩn hiện review trong Admin CMS.

