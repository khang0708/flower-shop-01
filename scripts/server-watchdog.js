/**
 * Ngọc Flower Atelier - Server Watchdog Daemon & Health Monitor
 * 
 * Script giám sát độc lập hoạt động 24/7 từ bên ngoài:
 * - Ping endpoint /api/health mỗi 60 giây (hoặc chạy qua Cron / PM2)
 * - Nếu server bị sập (downtime), mất kết nối hoặc Nginx 502:
 *   -> Gửi cảnh báo BÁO ĐỘNG ĐỎ tới Telegram CỦA DEVELOPER!
 *   -> Tự động thử kích hoạt lệnh restart (PM2 / Systemd / Node)
 * - Khi server hoạt động trở lại:
 *   -> Gửi thông báo PHỤC HỒI màu xanh tới Developer.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { 
  getDeveloperTelegramConfig, 
  sendDeveloperTelegramAlert 
} from '../server/monitoringBot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const STATE_FILE = path.join(ROOT_DIR, 'server', 'data', '.watchdog_state.json');

const HEALTH_URL = process.env.HEALTH_CHECK_URL || 'http://127.0.0.1:3001/api/health';
const CHECK_INTERVAL_MS = Number(process.env.WATCHDOG_INTERVAL_MS) || 60000;

// Đọc & Ghi trạng thái
const readState = () => {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch (e) {}
  }
  return { isDown: false, failedCount: 0, lastCheckTime: null };
};

const writeState = (state) => {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {}
};

// Hàm kiểm tra 1 lần (dùng được cả cho cron hoặc vòng lặp)
export const checkServerHealth = async () => {
  const state = readState();
  const timeStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(HEALTH_URL, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      // Server đang sống bình thường
      if (state.isDown) {
        // Vừa phục hồi từ sự cố!
        console.log(`[Watchdog] ✅ Server đã phục hồi lúc ${timeStr}!`);
        await sendDeveloperTelegramAlert(
          `🟢 <b>[NGỌC FLOWER - DEV OPS] MÁY CHỦ ĐÃ PHỤC HỒI!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `✅ <b>Trạng thái:</b> Backend đã Online & phản hồi tốt.\n` +
          `🌐 <b>URL:</b> ${HEALTH_URL}\n` +
          `⏱️ <b>Thời gian phục hồi:</b> ${timeStr}\n` +
          `━━━━━━━━━━━━━━━━━━━━`
        );
      }
      state.isDown = false;
      state.failedCount = 0;
      state.lastCheckTime = new Date().toISOString();
      writeState(state);
      return { ok: true, message: 'Server is healthy' };
    } else {
      throw new Error(`HTTP Status ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    state.failedCount = (state.failedCount || 0) + 1;
    console.error(`[Watchdog] ⚠️ Ping thất bại (${state.failedCount}):`, err.message);

    // Nếu thất bại >= 2 lần liên tiếp và chưa đánh dấu là Down
    if (state.failedCount >= 2 && !state.isDown) {
      state.isDown = true;
      console.error(`[Watchdog] 🚨 Báo động downtime tới Telegram Developer!`);
      await sendDeveloperTelegramAlert(
        `🚨🚨 <b>[NGỌC FLOWER - DEV OPS BÁO ĐỘNG ĐỎ] MÁY CHỦ BỊ SẬP (DOWNTIME)!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `❌ <b>Sự cố:</b> Không thể kết nối tới Backend API!\n` +
        `💬 <b>Chi tiết:</b> <code>${err.message}</code>\n` +
        `🌐 <b>Endpoint:</b> <code>${HEALTH_URL}</code>\n` +
        `⏱️ <b>Thời điểm phát hiện:</b> ${timeStr}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔄 <i>Hệ thống giám sát đang kiểm tra và thử kích hoạt lại tiến trình máy chủ...</i>`
      );

      // Thử tự động kích hoạt restart nếu có pm2 trên VPS
      exec('pm2 restart flower-shop-api', (execErr) => {
        if (!execErr) {
          console.log('[Watchdog] Đã kích hoạt lệnh restart thành công.');
        }
      });
    }

    state.lastCheckTime = new Date().toISOString();
    writeState(state);
    return { ok: false, error: err.message, failedCount: state.failedCount };
  }
};

// Nếu script được chạy trực tiếp bằng lệnh `node scripts/server-watchdog.js`
if (process.argv[1] && process.argv[1].endsWith('server-watchdog.js')) {
  console.log(`🌸 [Ngọc Flower Watchdog] Bắt đầu giám sát ${HEALTH_URL} (chu kỳ: ${CHECK_INTERVAL_MS / 1000}s)...`);
  const devConfig = getDeveloperTelegramConfig();
  if (!devConfig.isConfigured) {
    console.warn('⚠️ [Watchdog Note] Chưa cấu hình DEV_ALERT_TELEGRAM_TOKEN trong .env - Cảnh báo downtime sẽ chỉ ghi ra log.');
  }
  checkServerHealth();
  setInterval(checkServerHealth, CHECK_INTERVAL_MS);
}
