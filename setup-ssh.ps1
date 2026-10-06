# ==============================================================================
# Script tu dong tao va dang ky SSH Key len VPS AZDIGI tu Windows
# Cach chay: .\setup-ssh.ps1
# ==============================================================================

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " THIET LAP VA DANG KY SSH KEY TU DONG LEN VPS AZDIGI" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Nhap thong tin VPS
$VpsIp = Read-Host "Nhap dia chi IP cua VPS AZDIGI (vi du: 103.xxx.xxx.xxx)"
if ([string]::IsNullOrWhiteSpace($VpsIp)) {
    Write-Host "[!] Ban chua nhap IP. Huy tien trinh!" -ForegroundColor Red
    exit 1
}

$VpsUser = Read-Host "Nhap tai khoan SSH (Mac dinh: root)"
if ([string]::IsNullOrWhiteSpace($VpsUser)) {
    $VpsUser = "root"
}

$VpsPort = Read-Host "Nhap cong SSH (Mac dinh: 22)"
if ([string]::IsNullOrWhiteSpace($VpsPort)) {
    $VpsPort = "22"
}

# 2. Kiem tra hoac tao SSH Key tren may cuc bo
$SshDir = Join-Path $env:USERPROFILE ".ssh"
if (-not (Test-Path $SshDir)) {
    New-Item -ItemType Directory -Path $SshDir -Force | Out-Null
}

$KeyPath = Join-Path $SshDir "id_ed25519"
$PubKeyPath = "$KeyPath.pub"

if (-not (Test-Path $PubKeyPath)) {
    Write-Host "`n[+] Dang tu dong tao cap khoa SSH (Ed25519) moi..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -f $KeyPath -N '""' -C "flora-bloom-vps"
    Write-Host "[OK] Da tao khoa SSH thanh cong tai: $PubKeyPath" -ForegroundColor Green
} else {
    Write-Host "`n[OK] Da tim thay khoa SSH co san: $PubKeyPath" -ForegroundColor Green
}

$PubKeyContent = (Get-Content $PubKeyPath -Raw).Trim()

# 3. Dang ky Public Key len VPS AZDIGI
Write-Host "`n[+] Dang dong bo Public Key len VPS ($VpsUser@$VpsIp)..." -ForegroundColor Yellow
Write-Host "[!] He thong se hoi mat khau VPS lan dau tien de nap SSH Key:" -ForegroundColor Yellow

$RemoteCommand = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && grep -qF '$PubKeyContent' ~/.ssh/authorized_keys || echo '$PubKeyContent' >> ~/.ssh/authorized_keys"

ssh -p $VpsPort $VpsUser@$VpsIp $RemoteCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[OK] DANG KY SSH KEY LEN VPS THANH CONG!" -ForegroundColor Green
} else {
    Write-Host "`n[X] Co loi khi sao chep SSH Key len VPS. Vui long kiem tra lai mat khau hoac IP!" -ForegroundColor Red
    exit 1
}

# 4. Tao file cau hinh SSH Config de ket noi nhanh (ssh azdigi)
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
Write-Host "TU BAY GIO BAN CO THE DANG NHAP VPS KHONG CAN MAT KHAU:" -ForegroundColor Green
Write-Host "   Cach 1: ssh $Alias" -ForegroundColor Yellow
Write-Host "   Cach 2: ssh -p $VpsPort $VpsUser@$VpsIp" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan

# Kiem tra ket noi khong can mat khau
Write-Host "`n[+] Dang thu nghiem dang nhap khong mat khau vao VPS..." -ForegroundColor Cyan
ssh -o BatchMode=yes $Alias "echo '[OK] Ket noi thanh cong toi VPS:' `$(hostname)"
