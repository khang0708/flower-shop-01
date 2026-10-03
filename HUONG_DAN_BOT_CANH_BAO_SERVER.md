# 🤖 HƯỚNG DẪN CẤU HÌNH BOT TELEGRAM CẢNH BÁO SỰ CỐ MÁY CHỦ 24/7
> **Hệ thống giám sát lỗi & sự cố tự động cho:** Ngọc Flower (`hoatuoibmt.vn`)

---

## 🌟 1. Cơ Chế Hoạt Động Của Bot Cảnh Báo

Hệ thống bảo vệ máy chủ được thiết kế theo mô hình **Đa tầng (Multi-Layer Protection)**:

1. **Tầng 1 - Bắt lỗi tiến trình (Process Level):**
   - Tự động bắt các ngoại lệ chưa được xử lý (`uncaughtException`, `unhandledRejection`).
   - Tự động gửi tin nhắn Telegram khẩn cấp kèm phân loại lỗi, tên file, vị trí và Stack Trace.
2. **Tầng 2 - Bắt lỗi API & Dịch vụ (Express 500 Error Middleware):**
   - Khi có bất kỳ sự cố kết nối Database Neon, lỗi ghi đĩa hoặc lỗi logic 500, bot sẽ gửi cảnh báo kèm URL endpoint và IP gọi tới.
3. **Tầng 3 - Cảnh báo khi Server Khởi động lại / Reboot:**
   - Mỗi khi máy chủ vừa khởi động lại (sau khi deploy, sau sự cố VPS hoặc khi service được kích hoạt lại), bot lập tức gửi thông báo màu xanh báo trạng thái **Backend Online** thành công.
4. **Tầng 4 - Giám sát Downtime từ bên ngoài (`scripts/server-watchdog.js`):**
   - Script watchdog ping định kỳ vào `/api/health`.
   - Nếu server bị sập hoàn toàn (Node process tắt, VPS hết RAM, Nginx 502), watchdog phát hiện và gửi tin nhắn **BÁO ĐỘNG ĐỎ**, đồng thời tự động kích hoạt lệnh restart (`pm2 restart` / `systemctl restart`).
5. **Cơ chế Chống Spam (Throttling / Cooldown):**
   - Nếu một lỗi xảy ra liên tục 1,000 lần/phút, bot sẽ tự động gom nhóm và giới hạn (cooldown 60s/lỗi) để không làm phiền bạn và tránh bị Telegram khóa bot.

---

## ⚡ 2. Cách Tạo Bot Telegram & Lấy Chat ID Trong 1 Phút (Miễn Phí 100%)

### Bước 1: Tạo Bot Telegram (30 giây)
1. Mở ứng dụng Telegram trên điện thoại hoặc máy tính.
2. Tìm kiếm tài khoản chính thức: **`@BotFather`** (có tích xanh).
3. Gửi lệnh: `/newbot`
4. Đặt tên hiển thị cho bot: ví dụ `Ngọc Flower Server Alert`
5. Đặt username cho bot (phải kết thúc bằng chữ `bot`): ví dụ `ngoc_flower_alert_bot`
6. `@BotFather` sẽ cấp cho bạn một chuỗi **HTTP API Token** (dạng: `7123456789:AAH...`). Sao chép chuỗi này.

### Bước 2: Kích hoạt Bot & Lấy Chat ID (30 giây)
1. Bấm vào link bot bạn vừa tạo (ví dụ `t.me/ngoc_flower_alert_bot`).
2. Bấm nút **START** (hoặc gửi chữ `Hi` cho bot).
3. Vào trang **Quản Trị Admin của web** (`hoatuoibmt.vn` -> Cổng nội bộ -> Tab **Cấu hình Kênh Chat & MXH**):
   - Dán chuỗi **Bot Token** vào ô *Telegram Bot Token*.
   - Bấm nút **"Dò Tìm Chat ID Tự Động"** ➔ Hệ thống sẽ tự động điền Chat ID của bạn!
   - Bấm nút **"🚨 Thử Cảnh Báo Lỗi Server"** ➔ Bot sẽ ngay lập tức gửi một tin nhắn cảnh báo mẫu về Telegram để kiểm tra kết nối!
   - Bấm **Lưu Cài Đặt**.

---

## 🖥️ 3. Cấu Hình Biến Môi Trường Trên VPS (Khuyên Dùng Cho Môi Trường Production)

Để đảm bảo ngay cả khi file dữ liệu JSON bị lỗi thì bot vẫn hoạt động, bạn có thể thêm các biến sau vào file `.env` trên VPS:

```bash
# Telegram Alert Bot Config
TELEGRAM_BOT_TOKEN="7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxx"
TELEGRAM_CHAT_ID="123456789"
```

---

## ⏱️ 4. Thiết Lập Watchdog Tự Động Trên VPS (Tùy Chọn Thêm)

Bạn có thể cho chạy script watchdog kiểm tra định kỳ bằng **Crontab** hoặc **PM2**:

### Cách 1: Chạy định kỳ 2 phút/lần bằng Cron:
```bash
crontab -e
```
Thêm dòng sau:
```bash
*/2 * * * * cd /var/www/flower-shop && node scripts/server-watchdog.js >> /var/log/watchdog.log 2>&1
```

### Cách 2: Chạy ngầm liên tục bằng PM2:
```bash
pm2 start scripts/server-watchdog.js --name "flower-watchdog"
pm2 save
```
