import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEV_ALERTS_FILE = path.join(__dirname, 'data', 'dev-alerts.json');

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

/**
 * LẤY CẤU HÌNH BOT CỦA NHÀ PHÁT TRIỂN / KỸ THUẬT (DEVELOPER / DEVOPS BOT)
 * 
 * LƯU Ý QUAN TRỌNG:
 * - Bot này hoàn toàn độc lập với Bot nhận đơn hàng của khách hàng trong trang Admin.
 * - Khách hàng sẽ KHÔNG BAO GIỜ nhận được các thông báo kỹ thuật, lỗi crash hoặc stack trace.
 * - Bot này CHỈ gửi cho lập trình viên / chủ quản trị server.
 * 
 * Nguồn đọc:
 * 1. Biến môi trường .env trên VPS: DEV_ALERT_TELEGRAM_TOKEN & DEV_ALERT_TELEGRAM_CHAT_ID
 * 2. File cấu hình riêng tư server/data/dev-alerts.json (không bị git track)
 */
export const getDeveloperTelegramConfig = () => {
  let token = process.env.DEV_ALERT_TELEGRAM_TOKEN || 
              process.env.DEV_TELEGRAM_BOT_TOKEN || 
              process.env.TELEGRAM_ALERT_BOT_TOKEN || '';

  let chatId = process.env.DEV_ALERT_TELEGRAM_CHAT_ID || 
               process.env.DEV_TELEGRAM_CHAT_ID || 
               process.env.TELEGRAM_ALERT_CHAT_ID || '';

  // Đọc từ file dev-alerts.json nếu có
  if ((!token || !chatId) && fs.existsSync(DEV_ALERTS_FILE)) {
    try {
      const raw = fs.readFileSync(DEV_ALERTS_FILE, 'utf-8');
      const devConfig = JSON.parse(raw);
      if (!token && devConfig.botToken) token = devConfig.botToken;
      if (!chatId && devConfig.chatId) chatId = devConfig.chatId;
    } catch (e) {}
  }

  const cleanToken = cleanTelegramToken(token);
  const cleanId = cleanTelegramChatId(chatId);

  return {
    botToken: cleanToken,
    chatId: cleanId,
    isConfigured: Boolean(cleanToken && cleanId)
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

// Gửi tin nhắn đến Telegram API của Developer
export const sendDeveloperTelegramAlert = async (htmlText) => {
  try {
    const config = getDeveloperTelegramConfig();

    if (!config.isConfigured) {
      // Nếu Developer chưa cấu hình token riêng, ghi log ra console và không gửi
      return { 
        success: false, 
        message: 'Developer Telegram Bot chưa được cấu hình qua DEV_ALERT_TELEGRAM_TOKEN trong .env' 
      };
    }

    const telegramUrl = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const response = await fetchWithTimeout(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    }, 12000);

    const data = await response.json();
    if (!data.ok) {
      console.error('❌ [DevAlertBot] Telegram API error:', data.description);
      return { success: false, message: data.description };
    }

    return { success: true, data: data.result };
  } catch (err) {
    console.error('❌ [DevAlertBot] Lỗi mạng khi gửi Telegram cho Developer:', err.message);
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
// CÁC HÀM CẢNH BÁO SỰ CỐ DÀNH RIÊNG CHO DEVELOPER
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

    const html = `🚨 <b>[NGỌC FLOWER - DEV OPS] CẢNH BÁO SỰ CỐ SERVER!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ <b>Lỗi:</b> <code>${escapeTelegramHtml(errorName)}</code>\n` +
      `💬 <b>Mô tả:</b> <b>${escapeTelegramHtml(errorMessage)}</b>\n` +
      `📍 <b>Nơi phát sinh:</b> <code>${escapeTelegramHtml(errorLocation)}</code>\n` +
      (context.method ? `🌐 <b>Request:</b> <code>${escapeTelegramHtml(context.method)} ${escapeTelegramHtml(context.url || '')}</code>\n` : '') +
      (context.ip ? `🖥️ <b>Client IP:</b> <code>${escapeTelegramHtml(context.ip)}</code>\n` : '') +
      `⏱️ <b>Thời gian:</b> ${escapeTelegramHtml(timeStr)}\n` +
      `📊 <b>RAM Server:</b> ${memoryMB} MB\n` +
      suppressionNote +
      `\n🔍 <b>Stack Trace:</b>\n<pre>${stackSnippet}</pre>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👉 <i>Vui lòng SSH vào VPS (hoatuoibmt.vn) kiểm tra tiến trình!</i>`;

    return await sendDeveloperTelegramAlert(html);
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

    const html = `⚠️ <b>[NGỌC FLOWER - DEV OPS] CẢNH BÁO CẢNH GIÁC</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔔 <b>Sự kiện:</b> <b>${escapeTelegramHtml(title)}</b>\n` +
      `📝 <b>Chi tiết:</b> ${escapeTelegramHtml(message)}\n` +
      `⏱️ <b>Thời gian:</b> ${escapeTelegramHtml(timeStr)}\n` +
      `📊 <b>RAM Server:</b> ${memoryMB} MB\n` +
      (extra.details ? `\n📌 <code>${escapeTelegramHtml(JSON.stringify(extra.details, null, 2))}</code>\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━`;

    return await sendDeveloperTelegramAlert(html);
  } catch (e) {
    console.error('Error in notifyServerWarning:', e);
    return { success: false, message: e.message };
  }
};

/**
 * Thông báo khi máy chủ khởi động thành công (Server Boot / Reboot / Deploy)
 */
export const notifyServerStartup = async (extra = {}) => {
  try {
    const timeStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const memoryMB = Math.round(process.memoryUsage().rss / 1024 / 1024);

    const html = `🟢 <b>[NGỌC FLOWER - DEV OPS] MÁY CHỦ KHỞI ĐỘNG THÀNH CÔNG!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ <b>Trạng thái:</b> Backend Online & Hoạt động bình thường\n` +
      `🌐 <b>Website:</b> https://hoatuoibmt.vn\n` +
      `💻 <b>Môi trường:</b> Node.js ${process.version} (PID: ${process.pid})\n` +
      `⏱️ <b>Thời gian khởi động:</b> ${escapeTelegramHtml(timeStr)}\n` +
      `📊 <b>RAM ban đầu:</b> ${memoryMB} MB\n` +
      (extra.database ? `🗄️ <b>Cơ sở dữ liệu:</b> ${escapeTelegramHtml(extra.database)}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🤖 <i>Bot giám sát sự cố riêng cho Developer đã kích hoạt.</i>`;

    return await sendDeveloperTelegramAlert(html);
  } catch (e) {
    console.error('Error in notifyServerStartup:', e);
    return { success: false, message: e.message };
  }
};

/**
 * Thử nghiệm tin nhắn cảnh báo dành riêng cho Developer
 */
export const testDeveloperServerAlert = async (customToken = null, customChatId = null) => {
  const timeStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const memoryMB = Math.round(process.memoryUsage().rss / 1024 / 1024);

  const html = `🚨 <b>[TEST] THỬ NGHIỆM BOT GIÁM SÁT MÁY CHỦ (DÀNH CHO DEVELOPER)</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `✅ <b>Kết nối:</b> Bot của Developer hoạt động hoàn hảo!\n` +
    `🌐 <b>Domain:</b> https://hoatuoibmt.vn\n` +
    `⏱️ <b>Thời gian test:</b> ${escapeTelegramHtml(timeStr)}\n` +
    `📊 <b>Tài nguyên RAM:</b> ${memoryMB} MB\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🎉 <i>Bot này chỉ gửi sự cố kỹ thuật riêng cho bạn, hoàn toàn không liên quan đến Bot nhận đơn của khách hàng!</i>`;

  if (customToken && customChatId) {
    const telegramUrl = `https://api.telegram.org/bot${cleanTelegramToken(customToken)}/sendMessage`;
    const res = await fetchWithTimeout(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanTelegramChatId(customChatId),
        text: html,
        parse_mode: 'HTML'
      })
    });
    const data = await res.json();
    return { success: Boolean(data.ok), message: data.ok ? 'Thành công' : data.description, data: data.result };
  }

  return await sendDeveloperTelegramAlert(html);
};
