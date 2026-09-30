# 📖 Hướng Dẫn Triển Khai (Deploy) Flora Bloom Shop Lên VPS AZDIGI (Debian 13)

Tài liệu hướng dẫn chi tiết từng bước từ việc trỏ tên miền ở **Tenten**, thiết lập đăng nhập SSH không cần mật khẩu, cài đặt môi trường trên **VPS AZDIGI (Debian 13)**, đến tự động hóa triển khai bằng script.

---

## 📑 Mục lục
1. [Bước 1: Trỏ DNS trên Tenten về VPS AZDIGI](#bước-1-trỏ-dns-trên-tenten-về-vps-azdigi)
2. [Bước 2: Đăng ký SSH Key tự động từ máy cá nhân](#bước-2-đăng-ký-ssh-key-tự-động-từ-máy-cá-nhân)
3. [Bước 3: Cài đặt môi trường trên Debian 13](#bước-3-cài-đặt-môi-trường-trên-debian-13)
4. [Bước 4: Cấu hình Nginx Web Server & Reverse Proxy](#bước-4-cấu-hình-nginx-web-server--reverse-proxy)
5. [Bước 5: Kích hoạt SSL (HTTPS) miễn phí](#bước-5-kích-hoạt-ssl-https-miễn-phí)
6. [Bước 6: Sử dụng script `deploy.sh` để cập nhật tự động](#bước-6-sử-dụng-script-deploysh-để-cập-nhật-tự-động)

---

## Bước 1: Trỏ DNS trên Tenten về VPS AZDIGI
1. Đăng nhập trang quản lý tên miền Tenten ([navi.tenten.vn](https://navi.tenten.vn) hoặc [domain.tenten.vn](https://domain.tenten.vn)).
2. Vào phần **Cài đặt DNS / Quản lý bản ghi**.
3. Thêm 2 bản ghi `A` sau:
   - **Bản ghi 1:** Host `@` | Loại `A` | Giá trị: `<IP_CỦA_VPS_AZDIGI>` | TTL: 300
   - **Bản ghi 2:** Host `www` | Loại `A` | Giá trị: `<IP_CỦA_VPS_AZDIGI>` | TTL: 300

---

## Bước 2: Đăng ký SSH Key tự động từ máy cá nhân

### Dành cho Windows (PowerShell):
Mở terminal PowerShell tại thư mục dự án và chạy:
```powershell
.\setup-ssh.ps1
```
### Dành cho Git Bash / macOS / Linux:
```bash
bash setup-ssh.sh
```

*Script sẽ:*
- Hỏi địa chỉ IP VPS của bạn.
- Tự tạo cặp khóa SSH (Ed25519) nếu máy bạn chưa có.
- Tự sao chép public key vào `~/.ssh/authorized_keys` trên VPS (chỉ cần nhập mật khẩu VPS 1 lần duy nhất).
- Tạo alias kết nối nhanh `azdigi`.

> **Từ nay, để vào VPS bạn chỉ cần gõ:**
> ```bash
> ssh azdigi
> ```

---

## Bước 3: Cài đặt môi trường trên Debian 13

Đăng nhập vào VPS (`ssh azdigi`), chạy các lệnh sau để cài đặt công cụ cần thiết:

```bash
# 1. Cập nhật hệ điều hành
apt update && apt upgrade -y

# 2. Cài đặt Git, Curl, Nginx và Certbot SSL
apt install -y curl git nginx certbot python3-certbot-nginx

# 3. Cài đặt Node.js v20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Cài đặt PM2 để chạy tiến trình Backend ngầm
npm install -g pm2
```

---

## Bước 4: Cấu hình Nginx Web Server & Reverse Proxy

Tạo file cấu hình virtual host cho Nginx (thay `yourdomain.com` bằng tên miền thật của bạn):

```bash
nano /etc/nginx/sites-available/flower-shop
```

Dán nội dung cấu hình sau vào:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Giao diện Frontend React (Vite build tĩnh)
    root /var/www/flower-shop/dist;
    index index.html;

    # Hỗ trợ Client-side Routing của React
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Chuyển tiếp các cuộc gọi API sang Node.js Backend (Port 3001)
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Dung lượng tải lên tối đa (hỗ trợ upload ảnh hoa/sản phẩm)
        client_max_body_size 25M;
    }
}
```

Kích hoạt cấu hình:
```bash
ln -s /etc/nginx/sites-available/flower-shop /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## Bước 5: Kích hoạt SSL (HTTPS) miễn phí

Sau khi DNS từ Tenten đã nhận IP của VPS, chạy lệnh Certbot:

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

- Nhập email của bạn để nhận thông báo gia hạn chứng chỉ.
- Đồng ý với điều khoản dịch vụ (`Y`).
- Certbot sẽ tự động cấu hình HTTPS và tự động chuyển hướng toàn bộ lượt truy cập từ HTTP sang HTTPS.

---

## Bước 6: Sử dụng script `deploy.sh` để cập nhật tự động

Khi muốn triển khai lần đầu hoặc mỗi khi có code mới trên nhánh `development`:

```bash
# Cấp quyền thực thi (chỉ cần làm lần đầu)
chmod +x /var/www/flower-shop/deploy.sh

# Chạy deploy
/var/www/flower-shop/deploy.sh
```

**Script `deploy.sh` sẽ tự động thực hiện:**
1. Đồng bộ mã nguồn mới nhất từ GitHub (`git pull`).
2. Cài đặt các thư viện phụ thuộc (`npm install`).
3. Build mã nguồn giao diện React (`npm run build`).
4. Khởi động hoặc reload tiến trình backend qua **PM2**.
5. Kiểm tra và tải lại cấu hình **Nginx**.
6. Kiểm tra trạng thái hoạt động của API (`Health Check`).

---

### Quản lý tiến trình Backend khi cần:
- Xem danh sách: `pm2 list`
- Xem log hoạt động: `pm2 logs flower-shop-api`
- Khởi động lại: `pm2 restart flower-shop-api`
- Dừng backend: `pm2 stop flower-shop-api`
