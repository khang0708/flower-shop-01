#!/bin/bash
# ==============================================================================
# Script tự động triển khai (Deploy & Update) cho Flora Bloom Shop trên Debian 13
# Hỗ trợ: Git pull, Build Vite Frontend, Reload PM2 Backend, Reload Nginx
# ==============================================================================

set -e # Dừng script ngay khi có lỗi

# Màu sắc thông báo
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

APP_DIR="/var/www/flower-shop"
BRANCH="development"
APP_NAME="flower-shop-api"

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  🚀 BẮT ĐẦU TRIỂN KHAI DỰ ÁN FLORA BLOOM SHOP       ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Kiểm tra thư mục dự án
if [ ! -d "$APP_DIR" ]; then
    echo -e "${YELLOW}⚠️  Thư mục $APP_DIR chưa tồn tại. Đang clone dự án từ GitHub...${NC}"
    mkdir -p /var/www
    cd /var/www
    git clone https://github.com/khang0708/flower-shop-01.git flower-shop
    cd "$APP_DIR"
    git checkout "$BRANCH" || true
else
    echo -e "${GREEN}📂 Đang di chuyển vào thư mục: $APP_DIR${NC}"
    cd "$APP_DIR"

    echo -e "${GREEN}🔄 Đang kéo mã nguồn mới nhất từ nhánh $BRANCH...${NC}"
    git fetch origin
    git reset --hard "origin/$BRANCH"
fi

# 2. Cài đặt các gói phụ thuộc (Dependencies)
echo -e "${GREEN}📦 Đang cài đặt / cập nhật các thư viện Node.js...${NC}"
npm install --production=false

# 3. Build Frontend (Vite -> dist)
echo -e "${GREEN}🔨 Đang build Frontend React (Vite)...${NC}"
npm run build

# 4. Quản lý tiến trình Backend với PM2
echo -e "${GREEN}⚙️  Đang khởi động / reload Backend API qua PM2...${NC}"
if pm2 list | grep -q "$APP_NAME"; then
    echo -e "   -> Tiến trình $APP_NAME đã tồn tại, tiến hành reload..."
    pm2 reload "$APP_NAME"
else
    echo -e "   -> Khởi động mới tiến trình $APP_NAME trên port 3001..."
    pm2 start server/server.js --name "$APP_NAME"
fi

pm2 save

# 5. Kiểm tra và reload Nginx
echo -e "${GREEN}🌐 Đang kiểm tra và tải lại cấu hình Nginx...${NC}"
if nginx -t > /dev/null 2>&1; then
    systemctl reload nginx
    echo -e "   -> Nginx đã reload thành công!"
else
    echo -e "${RED}❌ Cấu hình Nginx có lỗi, vui lòng kiểm tra lại bằng lệnh 'nginx -t'!${NC}"
    exit 1
fi

# 6. Kiểm tra Health Check của Backend
echo -e "${GREEN}🩺 Đang kiểm tra trạng thái Backend API...${NC}"
sleep 2
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/health || true)

if [ "$HEALTH_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Backend API hoạt động tốt (Status: 200 OK)!${NC}"
else
    echo -e "${YELLOW}⚠️  Cảnh báo: Backend API phản hồi mã HTTP $HEALTH_STATUS. Hãy kiểm tra logs bằng lệnh: pm2 logs $APP_NAME${NC}"
fi

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}🎉 DEPLOY HOÀN TẤT THÀNH CÔNG!${NC}"
echo -e "${BLUE}======================================================${NC}"
