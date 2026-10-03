# 🤖 HƯỚNG DẪN CẤU HÌNH BOT TELEGRAM CẢNH BÁO SỰ CỐ MÁY CHỦ CHO DEVELOPER
> **Dành riêng cho Quản trị viên / Lập trình viên phụ trách hệ thống:** Ngọc Flower (`hoatuoibmt.vn`)

---

## 🔒 1. Phân Biệt Rõ Ràng Giữa 2 Bot Telegram

Hệ thống được tách biệt độc lập 100% thành 2 kênh Bot khác nhau:

| Tiêu chí | Bot 1: Dành cho Khách (Chủ tiệm) | Bot 2: Dành riêng cho Developer (Bạn) |
| :--- | :--- | :--- |
| **Nhiệm vụ** | Nhận thông báo khi có khách đặt hoa mới | Báo động lỗi crash, exception, 500 error, restart & downtime |
| **Nơi cấu hình** | Trang Quản Trị Admin (`settings.json`) | File `.env` hoặc `dev-alerts.json` trên VPS (Bảo mật riêng tư) |
| **Người nhận** | Khách hàng (Chủ shop) | Bạn (Lập trình viên / Quản trị máy chủ) |
| **Khách có thấy lỗi không?** | **TUYỆT ĐỐI KHÔNG** | Bạn nhận được đầy đủ Stack Trace & RAM Server |

---

## 🚀 2. Cách Cấu Hình Bot Riêng Của Bạn (Chỉ Mất 1 Phút)

### Bước 1: Tạo Bot Telegram riêng của bạn (hoặc dùng Bot cá nhân sẵn có)
1. Mở Telegram, tìm kiếm: **`@BotFather`**
2. Gửi lệnh: `/newbot`
3. Đặt tên bot: ví dụ `Khang Server Alert Bot`
4. Đặt username kết thúc bằng `bot`: ví dụ `khang_server_monitor_bot`
5. Nhận chuỗi **Token** do BotFather cấp.

### Bước 2: Lấy Chat ID của bạn
1. Mở bot bạn vừa tạo trên Telegram và bấm **START**.
2. Tìm bot **`@userinfobot`** trên Telegram và gửi tin nhắn bất kỳ ➔ Bot này sẽ trả về **Id** của bạn (ví dụ `123456789`).

### Bước 3: Cấu hình trên VPS (Khuyên dùng)
Mở file `.env` trên VPS (`/var/www/flower-shop/.env`):
```bash
# Bot Cảnh Báo Sự Cố Dành Riêng Cho Developer
DEV_ALERT_TELEGRAM_TOKEN="7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxx"
DEV_ALERT_TELEGRAM_CHAT_ID="123456789"
```

*Hoặc tạo file `server/data/dev-alerts.json` (file này đã được gitignore bảo mật):*
```json
{
  "botToken": "7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxx",
  "chatId": "123456789"
}
```

---

## 🧪 3. Thử Nghiệm Bắn Tin Nhắn Cảnh Báo Về Telegram Của Bạn

Để kiểm tra ngay lập tức xem bot có gửi tin nhắn về máy bạn hay không, bạn chỉ cần chạy lệnh sau từ terminal:

```bash
# Cách 1: Chạy trực tiếp script test kèm token và chatId của bạn
node scripts/test-dev-alert.js <BOT_TOKEN> <CHAT_ID>

# Cách 2: Sau khi đã điền vào .env
node scripts/test-dev-alert.js
```

Bot sẽ ngay lập tức gửi một tin nhắn cảnh báo mẫu về Telegram cá nhân của bạn!

---

## ⏱️ 4. Giám Sát Downtime 24/7 Bằng Watchdog

Nếu toàn bộ tiến trình Node.js bị tắt hoặc VPS bị sập, script ngoài [`scripts/server-watchdog.js`](file:///c:/Code/flower-shop-01/scripts/server-watchdog.js) sẽ tự động phát hiện sau 60 giây và bắn tin nhắn **BÁO ĐỘNG ĐỎ** về Telegram của bạn:

```bash
# Chạy nền bằng PM2 trên VPS:
pm2 start scripts/server-watchdog.js --name "flower-watchdog"
pm2 save
```
