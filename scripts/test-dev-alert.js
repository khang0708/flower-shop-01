/**
 * Script gửi tin nhắn thử nghiệm bot cảnh báo sự cố dành cho Developer
 * 
 * Cách chạy:
 *   node scripts/test-dev-alert.js
 * hoặc truyền trực tiếp token & chatId:
 *   node scripts/test-dev-alert.js <BOT_TOKEN> <CHAT_ID>
 */

import dotenv from 'dotenv';
dotenv.config();

import { 
  testDeveloperServerAlert, 
  getDeveloperTelegramConfig 
} from '../server/monitoringBot.js';

const cliToken = process.argv[2];
const cliChatId = process.argv[3];

async function run() {
  console.log('🌸 [Ngọc Flower] Bắt đầu thử nghiệm Bot Cảnh Báo Sự Cố Cho Developer...');

  const config = getDeveloperTelegramConfig();
  const token = cliToken || config.botToken;
  const chatId = cliChatId || config.chatId;

  if (!token || !chatId) {
    console.error('\n❌ [LỖI] Chưa tìm thấy cấu hình Bot của Developer!');
    console.log('👉 Bạn có thể chạy kèm tham số:');
    console.log('   node scripts/test-dev-alert.js <BOT_TOKEN> <CHAT_ID>');
    console.log('👉 Hoặc thiết lập trong file .env trên VPS:');
    console.log('   DEV_ALERT_TELEGRAM_TOKEN="7123456789:AAH..."');
    console.log('   DEV_ALERT_TELEGRAM_CHAT_ID="123456789"');
    process.exit(1);
  }

  console.log(`📡 Đang gửi tin nhắn test tới Chat ID: ${chatId}...`);
  const res = await testDeveloperServerAlert(token, chatId);

  if (res.success) {
    console.log('\n✅ [THÀNH CÔNG] Bot đã gửi tin nhắn cảnh báo thử nghiệm tới Telegram của bạn!');
    console.log('🎉 Hãy mở Telegram kiểm tra tin nhắn.');
  } else {
    console.error('\n❌ [THẤT BẠI] Lỗi gửi tin Telegram:', res.message);
  }
}

run();
