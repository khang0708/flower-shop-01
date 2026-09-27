# Deploy Flora & Bloom (Ngọc Flower) lên VPS (AZDIGI / Ubuntu)

Checklist đầy đủ từ VPS trống tới site chạy HTTPS. Domain đã mua qua Tenten.

## 0. Trước khi bắt đầu
- [ ] Đã có IP VPS (AZDIGI) + mật khẩu/SSH key root
- [ ] Đã lấy connection string Neon DB (Neon dashboard > Connection Details)
- [ ] Domain đã trỏ A record về IP VPS (làm ở bước 6, cần trước khi chạy certbot)

## 1. Kết nối SSH lần đầu
```bash
ssh root@<IP_VPS>
```

## 2. Cài Node.js, Nginx, PM2, Git
```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx git
npm install -g pm2
node -v   # kiểm tra >= 20.x
```

## 3. Tạo user riêng chạy app (không dùng root để chạy Node)
```bash
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
mkdir -p /var/www/flora-bloom-shop
chown -R deploy:deploy /var/www/flora-bloom-shop
su - deploy
```

## 4. Clone code
```bash
cd /var/www/flora-bloom-shop
git clone https://github.com/khang0708/flower-shop-01.git .
npm ci
```

## 5. Cấu hình biến môi trường
```bash
cp .env.example .env
nano .env   # điền DATABASE_URL thật từ Neon
```

## 6. Build frontend
```bash
npm run build
# kết quả nằm ở /var/www/flora-bloom-shop/dist
```

## 7. Trỏ DNS domain (làm trên trang quản lý Tenten)
Thêm bản ghi:
- Loại `A`, host `@`, giá trị = IP VPS
- Loại `A`, host `www`, giá trị = IP VPS

Đợi vài phút tới vài giờ để DNS lan truyền. Kiểm tra bằng:
```bash
ping yourdomain.com
```

## 8. Cấu hình Nginx
```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/flora-bloom-shop
sudo nano /etc/nginx/sites-available/flora-bloom-shop   # sửa "yourdomain.com" thành domain thật
sudo ln -s /etc/nginx/sites-available/flora-bloom-shop /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t   # kiểm tra config hợp lệ
sudo systemctl reload nginx
```

Ở bước này site đã chạy được qua HTTP (`http://yourdomain.com`) — kiểm tra trước khi làm SSL.

## 9. Bật HTTPS (Let's Encrypt / Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Certbot tự sửa file Nginx thêm block `listen 443 ssl` và tự cấu hình redirect HTTP -> HTTPS.
Certbot tự cài cron/systemd timer renew — không cần làm gì thêm, nhưng có thể test bằng:
```bash
sudo certbot renew --dry-run
```

> Thay thế: nếu dùng Cloudflare (khuyến nghị, xem trao đổi trước) thì bỏ qua bước certbot,
> chỉ cần trỏ domain qua Cloudflare nameserver, bật proxy, chọn SSL mode "Full (strict)",
> và dùng Cloudflare Origin Certificate thay cho cert Let's Encrypt trong Nginx.

## 10. Chạy backend bằng PM2
```bash
cd /var/www/flora-bloom-shop
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup   # copy lệnh nó in ra và chạy bằng sudo để PM2 tự khởi động lại khi VPS reboot
```

## 11. Kiểm tra
```bash
curl http://127.0.0.1:3001/api/health   # backend sống
curl -I https://yourdomain.com          # frontend + SSL sống
pm2 logs flora-bloom-api                # theo dõi log, xác nhận KHÔNG còn lỗi timeout
```

## 12. Quy trình cập nhật code sau này (deploy lại)
```bash
cd /var/www/flora-bloom-shop
git pull origin main
npm ci
npm run build
pm2 restart flora-bloom-api
```

## Ghi chú riêng cho dự án này
- `server/server.js` đã tự nhận diện: khi KHÔNG có biến `VERCEL`, nó sẽ `app.listen()` bình
  thường — đúng như trên VPS, không cần sửa gì thêm cho phần này.
- Route SSE (`/api/admin/events`) đã được giới hạn chỉ hoạt động khi không chạy trên Vercel,
  nghĩa là trên VPS nó **sẽ hoạt động đúng như thiết kế ban đầu** (giữ kết nối mở real-time) —
  vì VPS không có giới hạn thời gian request như serverless. Nếu muốn bật lại real-time
  SSE ở phía client cho production, sửa điều kiện `import.meta.env.DEV` trong
  `src/context/ShopContext.jsx` cho phù hợp với môi trường VPS.
