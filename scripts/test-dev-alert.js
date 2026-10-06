/**
 * Script gửi tin nhắn thử nghiệm bot cảnh báo sự cố dành cho Developer
 * 
 * Cách chạy:
 *   node scripts/test-dev-alert.js <BOT_TOKEN> [CHAT_ID]
 * hoặc chạy không tham số nếu đã cấu hình trong .env:
 *   node scripts/test-dev-alert.js
 */

import dotenv from 'dotenv';
dotenv.config();

import { 
  testDeveloperServerAlert, 
  getDeveloperTelegramConfig,
  cleanTelegramToken,
  cleanTelegramChatId
} from '../server/monitoringBot.js';

const cliToken = process.argv[2];
let cliChatId = process.argv[3];

async function run() {
  console.log('🌸 [Ngọc Flower] Bắt đầu kiểm tra Bot Cảnh Báo Sự Cố Cho Developer...\n');

  const config = getDeveloperTelegramConfig();
  const token = cleanTelegramToken(cliToken || config.botToken);
  let chatId = cleanTelegramChatId(cliChatId || config.chatId);

  if (!token) {
    console.error('❌ [LỖI] Chưa có Bot Token!');
    console.log('👉 Chạy lệnh kèm token:');
    console.log('   node scripts/test-dev-alert.js <BOT_TOKEN> [CHAT_ID]\n');
    process.exit(1);
  }

  // 1. Kiểm tra thông tin Bot qua getMe
  let botUsername = '';
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();
    if (!meData.ok) {
      console.error(`❌ [LỖI TOKEN]: Token không hợp lệ (${meData.description}). Hãy kiểm tra lại chuỗi từ @BotFather.`);
      process.exit(1);
    }
    botUsername = meData.result?.username;
    console.log(`🤖 Đã kết nối với Bot: @${botUsername} (${meData.result?.first_name})`);
  } catch (err) {
    console.error('❌ Lỗi kết nối Telegram API:', err.message);
    process.exit(1);
  }

  // 2. Nếu chưa có Chat ID, tự động dò tìm qua getUpdates
  if (!chatId) {
    console.log('🔍 Đang tự động dò tìm Chat ID từ tin nhắn của bạn gửi đến bot...');
    try {
      const updatesRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
      const updatesData = await updatesRes.json();
      const updates = updatesData.result || [];

      if (updates.length > 0) {
        const lastMsg = updates[updates.length - 1];
        const msgObj = lastMsg.message || lastMsg.channel_post || lastMsg.callback_query?.message;
        if (msgObj && msgObj.chat) {
          chatId = String(msgObj.chat.id);
          const name = msgObj.from?.first_name || msgObj.chat?.first_name || 'Bạn';
          console.log(`🎉 Tìm thấy Chat ID của ${name}: ${chatId}`);
        }
      }
    } catch (e) {}

    if (!chatId) {
      console.error(`\n⚠️ CHƯA TÌM THẤY CHAT ID!`);
      console.log(`👉 BƯỚC 1: Bấm vào link mở Bot: https://t.me/${botUsername}`);
      console.log(`👉 BƯỚC 2: Bấm nút START (hoặc gửi tin nhắn chữ "Hi" cho bot)`);
      console.log(`👉 BƯỚC 3: Chạy lại lệnh này, hệ thống sẽ tự động bắt Chat ID!\n`);
      process.exit(1);
    }
  }

  console.log(`📡 Đang gửi tin nhắn test tới Chat ID: ${chatId}...`);
  const res = await testDeveloperServerAlert(token, chatId);

  if (res.success) {
    console.log('\n======================================================');
    console.log('✅ [THÀNH CÔNG RỰC RỠ] Bot đã gửi tin nhắn thành công!');
    console.log(`📱 Hãy mở Telegram kiểm tra tin nhắn từ @${botUsername}`);
    console.log(`\n📌 THÔNG TIN CẤU HÌNH CỦA BẠN (Lưu lại để dùng trên VPS):`);
    console.log(`   DEV_ALERT_TELEGRAM_TOKEN="${token}"`);
    console.log(`   DEV_ALERT_TELEGRAM_CHAT_ID="${chatId}"`);
    console.log('======================================================\n');
  } else {
    console.error('\n❌ [THẤT BẠI] Lỗi từ Telegram:', res.message);
    if (res.message?.includes('chat not found') || res.message?.includes('bot was blocked')) {
      console.log(`\n👉 NGUYÊN NHÂN: Bạn chưa bấm START vào con bot @${botUsername}!`);
      console.log(`👉 Hãy bấm vào link này: https://t.me/${botUsername}`);
      console.log(`👉 Bấm nút "START" (hoặc gửi chữ "Hi" cho bot) rồi chạy lại lệnh nhé!\n`);
    }
  }
}

run();
