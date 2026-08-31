# 📋 FLORA & BLOOM - TIẾN ĐỘ VÀ BÀN GIAO TOÀN DIỆN DỰ ÁN

## 🎯 BẢNG TỔNG KẾT TIẾN ĐỘ 4 CHẶNG TÍNH NĂNG CHIẾN LƯỢC:

| Chặng | Tên Tính Năng | Trạng Thái | Git Commit Mốc |
| :--- | :--- | :---: | :--- |
| **Chặng 1** | In Hóa Đơn, Phiếu Giao Hàng & Thiệp Cắm Hoa | ✅ **HOÀN TẤT** | `7a15732` - `feat(orders): chặng 1 - thêm chức năng in hóa đơn...` |
| **Chặng 2** | Hệ Thống Mã Giảm Giá & Voucher Khuyến Mãi | ✅ **HOÀN TẤT** | `af7a028` - `feat(promo): chặng 2 - tích hợp hệ thống voucher...` |
| **Chặng 3** | Báo Cáo & Biểu Đồ Doanh Thu (Sales Analytics) | ✅ **HOÀN TẤT** | `0ecb2d8` - `feat(analytics): chặng 3 - tích hợp bảng điều khiển...` |
| **Chặng 4** | Đánh Giá & Feedback Thực Tế Từ Khách Hàng | ✅ **HOÀN TẤT** | `15b74b4` - `feat(reviews): chặng 4 - hoàn thiện hệ thống đánh giá...` |

---

## 📌 CHI TIẾT TỪNG CHẶNG ĐÃ TRIỂN KHAI VÀ XÁC THỰC:

### 💐 Chặng 1: In Hóa Đơn, Phiếu Giao & Thiệp Nghệ Thuật
* **Files:** `src/components/PrintInvoiceModal.jsx`, `src/components/AdminDashboard.jsx`.
* **Chức Năng:**
  * In phiếu giao hoa 2 liên chuẩn xưởng: Liên 1 Kẹp đơn giao (Địa chỉ, SĐT, Shipper note), Liên 2 Thiệp chúc mừng nghệ thuật nét chữ viết tay tinh tế kẹp vào bó hoa.
  * Hỗ trợ chuẩn `@media print` không bị vỡ layout khi in ra giấy A4 hoặc A5.
* **Commit:** `7a15732`

---

### 🎟️ Chặng 2: Hệ Thống Mã Giảm Giá Voucher & Quản Trị Khuyến Mãi
* **Files:** `server/data/discounts.json`, `vite.config.js`, `src/api/index.js`, `src/context/ShopContext.jsx`, `src/components/CartDrawer.jsx`, `src/components/CheckoutModal.jsx`, `src/components/AdminDashboard.jsx`.
* **Chức Năng:**
  * Hỗ trợ 3 loại voucher: Phần trăm `%` (kèm mức giảm tối đa), Số tiền cố định `đ`, Miễn phí vận chuyển (Freeship 35k).
  * Ràng buộc đơn hàng tối thiểu (`minOrderValue`), giới hạn số lượt dùng (`usageLimit`), hạn sử dụng.
  * Tự động trừ tiền real-time trong giỏ hàng & modal thanh toán.
  * Quản trị CMS Admin: Thêm mã, tự sinh mã ngẫu nhiên (`🎲 Tự Sinh`), bật/tắt kích hoạt, xóa mã.
* **Commit:** `af7a028`

---

### 📊 Chặng 3: Báo Cáo & Biểu Đồ Doanh Thu (Sales Analytics Dashboard)
* **Files:** `src/components/SalesAnalyticsView.jsx`, `src/components/AdminDashboard.jsx`.
* **Chức Năng:**
  * 4 Thẻ KPI vận hành/tài chính: Tổng doanh thu thực tế, Tổng đơn hàng, Giá trị trung bình/đơn (AOV), Tỷ lệ hài lòng duyệt ảnh hoa thật.
  * Biểu đồ cột xu hướng doanh thu 7 ngày gần nhất với hover tooltip và đánh dấu ngày hôm nay.
  * Biểu đồ tỷ lệ phân bổ đơn hàng theo các dịp tặng (Tình yêu, Sinh nhật, Khai trương, Tri ân,...).
  * Bảng xếp hạng Top mẫu hoa bán chạy nhất (Best Sellers) kèm ảnh mẫu và số lượng đơn đã bán.
* **Commit:** `0ecb2d8`

---

### ⭐ Chặng 4: Đánh Giá & Feedback Khách Hàng Thực Tế
* **Files:** `server/data/reviews.json`, `vite.config.js`, `src/api/index.js`, `src/context/ShopContext.jsx`, `src/components/ReviewsSection.jsx`, `src/App.jsx`, `src/components/AdminDashboard.jsx`.
* **Chức Năng:**
  * **Kho dữ liệu & REST API:** `server/data/reviews.json`, endpoints `GET, POST /api/reviews`, `PATCH /api/reviews/:id/toggle`, `DELETE /api/reviews/:id`.
  * **Storefront Section (`ReviewsSection.jsx`):** Hiển thị điểm số trung bình (4.9/5.0), bộ lọc (Tất cả, Có ảnh chụp thật, 5 sao), lưới thẻ review kèm ảnh thật, avatar, tên khách và huy hiệu `✓ Đã mua hàng thực tế`.
  * **Modal Gửi Đánh Giá Nhanh:** Khách hàng có thể chọn số sao, viết cảm nghĩ về độ tươi của hoa và thái độ shipper, dán ảnh chụp hoa nhận được.
  * **Admin CMS Kiểm Duyệt:** Tab `⭐ Đánh Giá & Feedback` trong Admin cho phép xem tất cả phản hồi, ẩn/hiện ngoài website hoặc xóa review không phù hợp.
* **Commit:** `15b74b4`

---

### 🛡️ Bộ Kiểm Thử Bảo Mật & Đơn Vị (Security & Unit Test Suite)
* **Files:** `tests/security-test.js`, `tests/unit-test.js`, `package.json`.
* **Lệnh chạy:** `npm test`
* **Tiêu chuẩn kiểm thử:**
  1. **Chống lộ lọt Token:** Mã nguồn Client không chứa Telegram Bot Token hardcode bí mật.
  2. **Chống tấn công XSS:** Làm sạch & mã hóa toàn bộ dữ liệu đầu vào (tên người đặt, lời chúc thiệp, nội dung bình luận).
  3. **Chống gian lận giảm giá (Coupon Tampering):** Giới hạn trần chiết khấu, ngăn chặn đơn hàng âm tiền, ràng buộc giá trị tối thiểu.
  4. **Kiểm soát đánh giá:** Chặn link ảnh chèn scheme độc hại (`javascript:`), giới hạn độ dài comment chống Spam Flood.
  5. **Xác thực Admin:** Phân quyền kiểm soát truy cập phiên làm việc chặt chẽ (Google, FB, Telegram SSO, PIN).
* **Commit:** `11213e6`

---

### 📅 Khắc Phục Lỗi Ngày Giao Hoa: Tự Động Load Mới Theo Ngày Thực Tế Mỗi Lần Đặt Đơn
* **Files:** [`src/components/CheckoutModal.jsx`](file:///Users/macbook/dev-learning/flora-bloom-shop/src/components/CheckoutModal.jsx), [`server/server.js`](file:///Users/macbook/dev-learning/flora-bloom-shop/server/server.js), [`src/context/ShopContext.jsx`](file:///Users/macbook/dev-learning/flora-bloom-shop/src/context/ShopContext.jsx)
* **Nguyên nhân lỗi trước đó:** 
  * Trong `CheckoutModal.jsx`, mảng ngày giao hoa bị gán cứng tĩnh `['Hôm nay (25/08)', 'Ngày mai (26/08)', 'Chọn ngày khác 📅']`. Khi khách hàng đặt đơn vào các ngày sau (27/08, 31/08, 01/09...), modal vẫn giữ nguyên mốc ngày 25/08 và không có ô chọn lịch cụ thể dẫn đến sai lệch ngày hẹn giao hoa.
* **Giải pháp khắc phục triệt để:**
  1. **Bộ tính toán ngày giao hoa động (`getDynamicDeliveryDates`):**
     * Tự động quét `new Date()` thời gian thực mỗi khi mở Modal Thanh toán để sinh ra:
       * **Hôm nay:** `Hôm nay (DD/MM)`
       * **Ngày mai:** `Ngày mai (DD/MM)`
       * **Ngày mốt:** `Thứ X (DD/MM)`
  2. **Tích hợp Bộ Chọn Ngày Tùy Chỉnh (HTML5 Date Picker):**
     * Thêm ô chọn ngày theo lịch `<input type="date" min={today} />` cho phép khách hàng chủ động chọn ngày giao hoa bất kỳ trong tương lai (đặt trước cho sinh nhật, kỷ niệm, ngày lễ 20/10, Valentine...).
  3. **Chuẩn hóa chuỗi thông tin giao hàng (`deliverySlot`):**
     * Kết hợp chính xác: `${currentDeliveryDateLabel} • ${selectedSlot}` (VD: `Hôm nay (31/08) • 14:00 - 16:00` hoặc `Ngày 15/09/2026 • 08:00 - 10:00`).
  4. **Thời gian tạo đơn (`createdAt`) chuẩn xác:**
     * Lưu đầy đủ cả giờ và ngày tạo đơn: `${timeStr} (${dateStr})` trên cả Client và Server Node.js.
* **Commit:** `d35af5f`

---

## 🛠️ HƯỚNG DẪN VẬN HÀNH & KIỂM TRA TOÀN DIỆN:
1. **Khởi chạy Development Server:**
   ```bash
   npm run dev
   ```
2. **Trải nghiệm Storefront:**
   * Mở `http://localhost:5173/` để xem giao diện khách hàng, danh mục hoa, giỏ hàng, áp dụng mã voucher (`FLORA10`, `FREESHIP`), và xem feedback thực tế ở mục **"Cảm Xúc & Đánh Giá Của Khách Hàng"**.
3. **Mở Bảng Điều Hành Quản Trị (Admin Portal):**
   * Bấm `Ctrl + Shift + A` (hoặc `Alt + Shift + A`) hoặc mở `http://localhost:5173/#admin` (hoặc bấm liên kết bí mật ở chân trang Footer).
   * Đăng nhập bảo mật bằng Google, Facebook hoặc Telegram SSO.
   * Khám phá đủ 7 Tabs:
     1. 📦 **Quản Lý Đơn Hàng & Cắm Mẫu** (Có nút `🖨️ In Phiếu Giao & Thiệp Kẹp Hoa`).
     2. 📊 **Báo Cáo Doanh Thu** (Biểu đồ doanh thu 7 ngày, Best Sellers, Occasion Share).
     3. 🌸 **Quản Lý Mẫu Hoa (Storefront CMS)**.
     4. 🎟️ **Quản Lý Voucher & Khuyến Mãi**.
     5. ⭐ **Kiểm Duyệt Đánh Giá & Feedback**.
     6. 💬 **Cài Đặt Zalo & Telegram Nhận Đơn** (Có nút tự động dò tìm Chat ID).
     7. 🏷️ **Tồn Kho Hoa Tươi**.
