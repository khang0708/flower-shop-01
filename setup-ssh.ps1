# ==============================================================================
# Script tự động tạo & đăng ký SSH Key lên VPS AZDIGI từ máy tính Windows
# Cách chạy: Mở PowerShell -> gõ: .\setup-ssh.ps1
# ==============================================================================

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " 🔐 THIẾT LẬP & ĐĂNG KÝ SSH KEY TỰ ĐỘNG LÊN VPS AZDIGI" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Nhập thông tin VPS
$VpsIp = Read-Host "👉 Nhập địa chỉ IP của VPS AZDIGI (ví dụ: 103.xxx.xxx.xxx)"
if ([string]::IsNullOrWhiteSpace($VpsIp)) {
    Write-Host "❌ Bạn chưa nhập IP. Hủy tiến trình!" -ForegroundColor Red
    exit 1
}

$VpsUser = Read-Host "👉 Nhập tài khoản SSH (Mặc định: root)"
if ([string]::IsNullOrWhiteSpace($VpsUser)) {
    $VpsUser = "root"
}

$VpsPort = Read-Host "👉 Nhập cổng SSH (Mặc định: 22)"
if ([string]::IsNullOrWhiteSpace($VpsPort)) {
    $VpsPort = "22"
}

# 2. Kiểm tra hoặc tạo SSH Key trên máy cục bộ
$SshDir = Join-Path $env:USERPROFILE ".ssh"
if (-not (Test-Path $SshDir)) {
    New-Item -ItemType Directory -Path $SshDir -Force | Out-Null
}

$KeyPath = Join-Path $SshDir "id_ed25519"
$PubKeyPath = "$KeyPath.pub"

if (-not (Test-Path $PubKeyPath)) {
    Write-Host "`n🔑 Đang tự động tạo cặp khóa SSH (Ed25519) mới..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -f $KeyPath -N '""' -C "flora-bloom-vps"
    Write-Host "✅ Đã tạo khóa SSH thành công tại: $PubKeyPath" -ForegroundColor Green
} else {
    Write-Host "`n✅ Đã tìm thấy khóa SSH có sẵn: $PubKeyPath" -ForegroundColor Green
}

$PubKeyContent = (Get-Content $PubKeyPath -Raw).Trim()

# 3. Đăng ký Public Key lên VPS AZDIGI
Write-Host "`n📡 Đang đồng bộ Public Key lên VPS ($VpsUser@$VpsIp)..." -ForegroundColor Yellow
Write-Host "⚠️  Hệ thống sẽ hỏi mật khẩu VPS lần đầu tiên (hoặc mã xác thực) để nạp SSH Key:" -ForegroundColor Yellow

$RemoteCommand = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && grep -qF '$PubKeyContent' ~/.ssh/authorized_keys || echo '$PubKeyContent' >> ~/.ssh/authorized_keys"

ssh -p $VpsPort $VpsUser@$VpsIp $RemoteCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 ĐĂNG KÝ SSH KEY LÊN VPS THÀNH CÔNG!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Có lỗi khi sao chép SSH Key lên VPS. Vui lòng kiểm tra lại mật khẩu hoặc IP!" -ForegroundColor Red
    exit 1
}

# 4. Tạo file cấu hình SSH Config để kết nối nhanh (ssh azdigi)
$ConfigFile = Join-Path $SshDir "config"
$Alias = "azdigi"
$ConfigBlock = @"

# AZDIGI VPS Flora Bloom
Host $Alias
    HostName $VpsIp
    User $VpsUser
    Port $VpsPort
    IdentityFile $KeyPath
"@

if (Test-Path $ConfigFile) {
    $ExistingConfig = Get-Content $ConfigFile -Raw
    if ($ExistingConfig -notmatch "Host\s+$Alias") {
        Add-Content -Path $ConfigFile -Value $ConfigBlock
    }
} else {
    Set-Content -Path $ConfigFile -Value $ConfigBlock
}

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "✨ TỪ BÂY GIỜ BẠN CÓ THỂ ĐĂNG NHẬP VPS KHÔNG CẦN MẬT KHẨU:" -ForegroundColor Green
Write-Host "   Cách 1: ssh $Alias" -ForegroundColor Yellow
Write-Host "   Cách 2: ssh -p $VpsPort $VpsUser@$VpsIp" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan

# Kiểm tra kết nối không cần mật khẩu
Write-Host "`n🔍 Đang thử nghiệm đăng nhập không mật khẩu..." -ForegroundColor Cyan
ssh -o BatchMode=yes $Alias "echo '✅ Kết nối thành công tới máy chủ:' \$(hostname) '(Debian 13)'"
