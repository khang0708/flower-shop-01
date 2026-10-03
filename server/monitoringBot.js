import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

// Helper escape HTML cho Telegram parse_mode: 'HTML'
export const escapeTelegramHtml = (text) => {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

// Clean helpers
export const cleanTelegramToken = (token) => {
  if (!token) return '';
  return String(token).trim().replace(/^bot/i, '');
};

export const cleanTelegramChatId = (chatId) => {
  if (!chatId) return '';
  return String(chatId).trim();
};

// Lấy thông tin Telegram Bot Token & Chat ID từ ENV hoặc settings.json
export const getTelegramConfig = () => {
  // 1. Ưu tiên biến môi trường (an toàn tuyệt đối, không sợ file hỏng)
  let token = process.env.TELEGRAM_ALERT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';
  let chatId = process.env.TELEGRAM_ALERT_CHAT_ID || process.env.TELEGRAM_CHAT_ID || '';
  let isAlertsEnabled = true;

  // 2. Nếu thiếu, đọc từ server/data/settings.json
  if ((!token || !chatId) && fs.existsSync(SETTINGS_FILE)) {
    try {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const settings = JSON.parse(raw);
      if (!token && settings.telegramBotToken) {
        token = settings.telegramBotToken;
      }
      if (!chatId && settings.telegramChatId) {
        chatId = settings.telegramChatId;
      }
      if (settings.telegramAlertsEnabled !== undefined) {
        isAlertsEnabled = Boolean(settings.telegramAlertsEnabled);
      }
    } catch (err) {
      console.warn('⚠️ [MonitoringBot] Không thể đọc settings.json:', err.message);
    }
  }

  return {
    botToken: cleanTelegramToken(token),
    chatId: cleanTelegramChatId(chatId),
    isEnabled: isAlertsEnabled && Boolean(cleanTelegramToken(token) && cleanTelegramChatId(chatId))
  };
};

// fetchWithTimeout an toàn
const fetchWithTimeout = async (url, options = {}, ms = 10000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

// Gửi tin nhắn đến Telegram API
export const sendTelegramMessage = async (htmlText, customChatId = null, customToken = null) => {
  try {
    const config = getTelegramConfig();
    const token = cleanTelegramToken(customToken || config.botToken);
    const chatId = cleanTelegramChatId(customChatId || config.chatId);

    if (!token || !chatId) {
      return { success: false, message: 'Chưa cấu hình Telegram Bot Token hoặc Chat ID' };
    }

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetchWithTimeout(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    }, 12000);

    const data = await response.json();
    if (!data.ok) {
      console.error('❌ [MonitoringBot] Telegram API error:', data.description);
      return { success: false, message: data.description };
    }

    return { success: true, data: data.result };
  } catch (err) {
    console.error('❌ [MonitoringBot] Network error when sending to Telegram:', err.message);
    return { success: false, message: err.message };
  }
};

// ----------------------------------------------------
// ANTI-SPAM & THROTTLING (Tránh gửi dồn dập hàng nghìn tin nhắn khi bị crash lặp)
// ----------------------------------------------------
const alertHistory = new Map();
const COOLDOWN_MS = 60000; // 1 phút cooldown cho mỗi loại lỗi

const shouldSendAlert = (key) => {
  const now = Date.now();
  const record = alertHistory.get(key);
  if (!record) {
    alertHistory.set(key, { lastTime: now, count: 1 });
    return { send: true, count: 1 };
  }

  if (now - record.lastTime < COOLDOWN_MS) {
    record.count++;
    return { send: false, count: record.count };
  }

  const previousCount = record.count;
  alertHistory.set(key, { lastTime: now, count: 1 });
  return { send: true, count: 1, suppressedCount: previousCount > 1 ? previousCount : 0 };
};

// ----------------------------------------------------
// CÁC HÀM CẢNH BÁO CHUYÊN DỤNG (SPECIALIZED ALERTS)
// ----------------------------------------------------

/**
 * Cảnh báo khi có Lỗi Hệ Thống hoặc Ngoại Lệ (Uncaught Exception, Express 500, Database Timeout...)
 */
export const notifyServerError = async (error, context = {}) => {
  try {
    const errorName = error?.name || 'ServerError';
    const errorMessage = error?.message || String(error) || 'Lỗi không xác định';
    const errorLocation = context.location || 'Backend API';
    const alertKey = `${errorName}:${errorMessage}:${errorLocation}`;

    const throttle = shouldSendAlert(alertKey);
    if (!throttle.send) {
      return { success: false, throttled: true, count: throttle.count };
    }

    const timeStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const memoryMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const stackSnippet = error?.stack 
      ? escapeTelegramHtml(error.stack.split('\n').slice(0, 5).join('\n')) 
      : 'Không có Stack Trace';

    let suppressionNote = '';
    if (throttle.suppressedCount) {
      suppressionNote = `\n🔁 <i>(Lưu ý: Lỗi này vừa lặp lại <b>${throttle.suppressedCount} lần</b> trong 60 giây qua)</i>\n`;
    }

    const html = `🚨 <b>[NGỌC FLOWER] CẢNH BÁO SỰ CỐ MÁY CHỦ!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ <b>Phân loại:</b> <code>${escapeTelegramHtml(errorName)}</code>\n` +
      `💬 <b>Mô tả:</b> <b>${escapeTelegramHtml(errorMessage)}</b>\n` +
      `📍 <b>Nơi xảy ra:</b> <code>${escapeTelegramHtml(errorLocation)}</code>\n` +
      (context.method ? `🌐 <b>Request:</b> <code>${escapeTelegramHtml(context.method)} ${escapeTelegramHtml(context.url || '')}</code>\n` : '') +
      (context.ip ? `🖥️ <b>Client IP:</b> <code>${escapeTelegramHtml(context.ip)}</code>\n` : '') +
      `⏱️ <b>Thời gian:</b> ${escapeTelegramHtml(timeStr)}\n` +
      `📊 <b>RAM Server:</b> ${memoryMB} MB\n` +
      suppressionNote +
      `\n🔍 <b>Chi tiết Stack Trace:</b>\n<pre>${stackSnippet}</pre>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👉 <i>Vui lòng kiểm tra log hệ thống trên VPS (hoatuoibmt.vn) ngay lập tức!</i>`;

    return await sendTelegramMessage(html);
  } catch (e) {
    console.error('Error in notifyServerError:', e);
    return { success: false, message: e.message };
  }
};

/**
 * Cảnh báo trạng thái bất thường (Warning: DB mất kết nối, RAM cao, v.v.)
 */
export const notifyServerWarning = async (title, message, extra = {}) => {
  try {
    const alertKey = `warning:${title}`;
    const throttle = shouldSendAlert(alertKey);
    if (!throttle.send) return { success: false, throttled: true };

    const timeStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const memoryMB = Math.round(process.memoryUsage().rss / 1024 / 1024);

    const html = `⚠️ <b>[NGỌC FLOWER] CẢNH BÁO CẢNH GIÁC MÁY CHỦ</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔔 <b>Sự kiện:</b> <b>${escapeTelegramHtml(title)}</b>\n` +
      `📝 <b>Chi tiết:</b> ${escapeTelegramHtml(message)}\n` +
      `⏱️ <b>Thời gian:</b> ${escapeTelegramHtml(timeStr)}\n` +
      `📊 <b>RAM Server:</b> ${memoryMB} MB\n` +
      (extra.details ? `\n📌 <code>${escapeTelegramHtml(JSON.stringify(extra.details, null, 2))}</code>\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━`;

    return await sendTelegramMessage(html);
  } catch (e) {
    console.error('Error in notifyServerWarning:', e);
    return { success: false, message: e.message };
  }
};

/**
 * Thông báo khi máy chủ khởi động thành công (Server Boot / Reboot)
 */
export const notifyServerStartup = async (extra = {}) => {
  try {
    const timeStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const memoryMB = Math.round(process.memoryUsage().rss / 1024 / 1024);

    const html = `🟢 <b>[NGỌC FLOWER] MÁY CHỦ ĐÃ KHỞI ĐỘNG THÀNH CÔNG!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ <b>Trạng thái:</b> Backend Online & Hoạt động bình thường\n` +
      `🌐 <b>Website:</b> https://hoatuoibmt.vn\n` +
      `💻 <b>Node.js:</b> ${process.version} (PID: ${process.pid})\n` +
      `⏱️ <b>Thời gian khởi động:</b> ${escapeTelegramHtml(timeStr)}\n` +
      `📊 <b>RAM ban đầu:</b> ${memoryMB} MB\n` +
      (extra.database ? `🗄️ <b>Cơ sở dữ liệu:</b> ${escapeTelegramHtml(extra.database)}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🤖 <i>Hệ thống giám sát lỗi tự động 24/7 đã được kích hoạt.</i>`;

    return await sendTelegramMessage(html);
  } catch (e) {
    console.error('Error in notifyServerStartup:', e);
    return { success: false, message: e.message };
  }
};

/**
 * Gửi tin nhắn test kiểm tra bot cảnh báo
 */
export const testServerAlert = async (customChatId = null, customToken = null) => {
  const timeStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const memoryMB = Math.round(process.memoryUsage().rss / 1024 / 1024);

  const html = `🚨 <b>[TEST] THỬ NGHIỆM BOT CẢNH BÁO SỰ CỐ MÁY CHỦ</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `✅ <b>Kết nối:</b> Bot hoạt động hoàn hảo!\n` +
    `🤖 <b>Tên bot:</b> Ngọc Flower Server Monitor Bot\n` +
    `🌐 <b>Domain:</b> https://hoatuoibmt.vn\n` +
    `⏱️ <b>Thời gian test:</b> ${escapeTelegramHtml(timeStr)}\n` +
    `📊 <b>Tài nguyên RAM:</b> ${memoryMB} MB\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🎉 <i>Từ nay, bất kỳ lỗi nghiêm trọng, sập kết nối hoặc restart máy chủ nào sẽ được bot gửi cảnh báo ngay tức thì tới Telegram của bạn!</i>`;

  return await sendTelegramMessage(html, customChatId, customToken);
};
