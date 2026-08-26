# 🌸 FLORA & BLOOM ATELIER - DEV LOG & CHUYỂN GIAO NGỮ CẢNH

Tài liệu này lưu trữ tiến độ phát triển, kiến trúc hệ thống và trạng thái các Milestone của dự án để đảm bảo không bị mất ngữ cảnh khi mở phiên làm việc mới.

---

## 🗺️ BẢNG TIẾN ĐỘ LỘ TRÌNH (ROADMAP PROGRESS)

| Chặng | Tên Tính Năng | Trạng Thái | Git Commit Mốc |
| :--- | :--- | :---: | :--- |
| **Chặng 1** | In Hóa Đơn, Phiếu Giao Hàng & Thiệp Cắm Hoa | ✅ **HOÀN TẤT** | `7a15732` - `feat(orders): chặng 1 - thêm chức năng in hóa đơn...` |
| **Chặng 2** | Hệ Thống Mã Giảm Giá & Voucher Khuyến Mãi | ⏳ **TIẾP THEO** | *Đang chuẩn bị triển khai* |
| **Chặng 3** | Báo Cáo & Biểu Đồ Doanh Thu | ⏹️ Chưa bắt đầu | - |
| **Chặng 4** | Đánh Giá & Feedback Thực Tế Từ Khách Hàng | ⏹️ Chưa bắt đầu | - |

---

## 📌 CHI TIẾT CÁC TÍNH NĂNG ĐÃ HOÀN THÀNH:

### ✅ Chặng 1: In Hóa Đơn, Phiếu Giao & Thiệp Nghệ Thuật
* **Files:**
  * `src/components/PrintInvoiceModal.jsx` (Component xem trước & in phiếu, tự động định dạng `@media print`).
  * `src/components/AdminDashboard.jsx` (Nút `🖨️ In Phiếu Giao & Thiệp Kẹp Hoa` trong từng đơn hàng).
* **Chức Năng:**
  * In phiếu giao hàng chuẩn studio: Mã đơn, Khách đặt, Người nhận, SĐT, Địa chỉ, Chi tiết từng món & Quà tặng kèm, Chữ ký 3 bên.
  * In thiệp kẹp hoa nghệ thuật: Khung viền botanical, Lời chúc thiệp của khách, Tên người gửi, Slogan studio.
* **Xác Thực:** Build thành công 100%, CSS in chuẩn xác.

---

## 🚀 TIẾP THEO: CHẶNG 2 (Mã Giảm Giá & Voucher Khuyến Mãi)
* **Mục Tiêu:**
  1. API backend `/api/discounts` quản lý danh sách mã (ví dụ: `FLORA10` giảm 10%, `VALENTINE50K` giảm 50k, `FREESHIP` miễn phí vận chuyển 35k).
  2. Input áp mã voucher tại `CartDrawer` và `CheckoutModal`.
  3. Quản lý danh sách voucher trên Tab mới của `AdminDashboard`.
