#!/bin/bash
# ==============================================================================
# Script tự động tạo & nạp SSH Key lên VPS AZDIGI (Dành cho Git Bash / Linux / macOS)
# Cách chạy: bash setup-ssh.sh
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE} 🔐 THIẾT LẬP & ĐĂNG KÝ SSH KEY TỰ ĐỘNG LÊN VPS AZDIGI${NC}"
echo -e "${BLUE}======================================================${NC}"

read -p "👉 Nhập địa chỉ IP của VPS AZDIGI: " VPS_IP
if [ -z "$VPS_IP" ]; then
    echo -e "${RED}❌ Bạn chưa nhập IP VPS. Hủy bỏ!${NC}"
    exit 1
fi

read -p "👉 Nhập tài khoản SSH (Mặc định: root): " VPS_USER
VPS_USER=${VPS_USER:-root}

read -p "👉 Nhập cổng SSH (Mặc định: 22): " VPS_PORT
VPS_PORT=${VPS_PORT:-22}

SSH_DIR="$HOME/.ssh"
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

KEY_PATH="$SSH_DIR/id_ed25519"
PUB_KEY="$KEY_PATH.pub"

# 1. Kiểm tra hoặc tạo SSH Key mới
if [ ! -f "$PUB_KEY" ]; then
    echo -e "${YELLOW}🔑 Đang tạo cặp khóa SSH (Ed25519) mới...${NC}"
    ssh-keygen -t ed25519 -f "$KEY_PATH" -N "" -C "flora-bloom-vps"
    echo -e "${GREEN}✅ Đã tạo khóa SSH thành công tại: $PUB_KEY${NC}"
else
    echo -e "${GREEN}✅ Đã tìm thấy khóa SSH có sẵn: $PUB_KEY${NC}"
fi

# 2. Đăng ký SSH Key lên VPS
echo -e "${YELLOW}📡 Đang tải SSH Key lên VPS ($VPS_USER@$VPS_IP)...${NC}"
echo -e "${YELLOW}⚠️  Nhập mật khẩu VPS lần đầu tiên để phân quyền SSH Key:${NC}"

if command -v ssh-copy-id > /dev/null 2>&1; then
    ssh-copy-id -p "$VPS_PORT" -i "$PUB_KEY" "$VPS_USER@$VPS_IP"
else
    PUB_CONTENT=$(cat "$PUB_KEY")
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" "mkdir -p ~/.ssh && chmod 700 ~/.ssh && touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && grep -qF '$PUB_CONTENT' ~/.ssh/authorized_keys || echo '$PUB_CONTENT' >> ~/.ssh/authorized_keys"
fi

# 3. Thêm alias cấu hình SSH config
CONFIG_FILE="$SSH_DIR/config"
if ! grep -q "Host azdigi" "$CONFIG_FILE" 2>/dev/null; then
    cat <<EOF >> "$CONFIG_FILE"

# AZDIGI VPS Flora Bloom
Host azdigi
    HostName $VPS_IP
    User $VPS_USER
    Port $VPS_PORT
    IdentityFile $KEY_PATH
EOF
    echo -e "${GREEN}✅ Đã tạo alias 'azdigi' trong $CONFIG_FILE${NC}"
fi

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}🎉 ĐĂNG KÝ SSH THÀNH CÔNG!${NC}"
echo -e "Từ bây giờ bạn chỉ cần gõ:"
echo -e "${YELLOW}   ssh azdigi${NC}"
echo -e "để vào thẳng VPS mà không cần gõ mật khẩu nữa."
echo -e "${BLUE}======================================================${NC}"
