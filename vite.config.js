import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'server', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const readJson = (fileName) => {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    return null;
  }
};

const writeJson = (fileName, data) => {
  const filePath = path.join(DATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

const sseClients = new Set();
const broadcastAdminEvent = (payload) => {
  const message = `data: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach((res) => {
    try {
      res.write(message);
    } catch (e) {
      sseClients.delete(res);
    }
  });
};

// Helper gửi tin nhắn trực tiếp qua Telegram API
async function sendTelegramMessage(botToken, chatId, order) {
  if (!botToken || !chatId) return false;
  const token = botToken.trim().replace(/^bot/i, '');
  const targetChatId = String(chatId).trim();

  // Danh sách các món hoa và quà kèm chi tiết
  let itemsListText = '';
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsListText = '\n📋 <b>Chi tiết sản phẩm & quà kèm:</b>\n' +
      order.items.map((it, idx) => `  ${idx + 1}. ${it.name} (<b>${Number(it.price || 0).toLocaleString('vi-VN')}đ</b>)`).join('\n') + '\n';
  }

  const anonymousNotice = order.isAnonymous ? ' <i>(🕵️ Đơn gửi ẩn danh bí mật)</i>' : '';

  const htmlMessage = `🌸 <b>CÓ ĐƠN ĐẶT HOA MỚI!</b> (#${order.orderCode || order.id})\n\n` +
    `👤 <b>Người đặt:</b> ${order.customerName || 'Khách hàng'}${anonymousNotice}\n` +
    `📞 <b>SĐT khách:</b> ${order.customerPhone || 'Chưa cung cấp'}\n` +
    `💐 <b>Mẫu hoa chính:</b> ${order.productName || 'Bó hoa tươi nghệ thuật'}\n` +
    itemsListText +
    `💰 <b>Tổng thanh toán:</b> <b>${Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ</b>\n` +
    `⏱️ <b>Khung giờ hẹn:</b> ${order.deliverySlot || 'Trong ngày'}\n` +
    `📍 <b>Người nhận:</b> ${order.receiverName || ''} (${order.receiverPhone || ''})\n` +
    `🏠 <b>Địa chỉ:</b> ${order.receiverAddress || 'Chưa cung cấp'}\n` +
    `💌 <b>Lời chúc thiệp:</b> <i>"${order.cardMessage || 'Gửi gắm yêu thương!'}"</i>\n` +
    `✍️ <b>Ký tên:</b> <i>"${order.senderSign || order.customerName || 'Người gửi'}"</i>\n\n` +
    `👉 <i>Flora & Bloom Studio: Hãy mở Admin để cắm mẫu và gửi ảnh duyệt nhé!</i>`;

  try {
    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: htmlMessage,
        parse_mode: 'HTML'
      })
    });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.warn('Lỗi server gửi Telegram:', err.message);
    return false;
  }
}

function fullstackApiPlugin() {
  return {
    name: 'flora-fullstack-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.originalUrl || req.url || '';
        const url = rawUrl.split('?')[0];

        if (!url.startsWith('/api')) {
          return next();
        }

        // 1. Health check
        if (url === '/api/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ONLINE', service: 'Flora & Bloom Vite Direct API' }));
          return;
        }

        // 2. Realtime SSE
        if (url === '/api/admin/events' && req.method === 'GET') {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);
          sseClients.add(res);
          req.on('close', () => sseClients.delete(res));
          return;
        }

        // Helper to read JSON body
        const readBody = () => new Promise((resolve) => {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              resolve(body ? JSON.parse(body) : {});
            } catch (e) {
              resolve({});
            }
          });
        });

        // 3. Settings API (Lưu Token & Cấu hình máy chủ)
        if (url === '/api/settings') {
          if (req.method === 'GET') {
            const settings = readJson('settings.json') || {};
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: settings }));
            return;
          }
          if (req.method === 'POST' || req.method === 'PUT') {
            const body = await readBody();
            const current = readJson('settings.json') || {};
            const updated = { ...current, ...body, updatedAt: new Date().toISOString() };
            writeJson('settings.json', updated);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: updated }));
            return;
          }
        }

        // 4. Products API
        if (url === '/api/products') {
          if (req.method === 'GET') {
            const products = readJson('products.json') || [];
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: products }));
            return;
          }
          if (req.method === 'POST') {
            const body = await readBody();
            const products = readJson('products.json') || [];
            const newProduct = {
              id: body.id || `fl-${Date.now()}`,
              name: body.name || 'Bó Hoa Mới',
              subtitle: body.subtitle || '',
              price: Number(body.price) || 500000,
              originalPrice: Number(body.originalPrice) || Number(body.price) || 600000,
              occasion: body.occasion || 'love',
              colorTone: body.colorTone || 'pastel',
              image: body.image || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
              tags: body.tags || ['Mẫu Mới'],
              meaning: body.meaning || 'Gửi gắm yêu thương.',
              flowerTypes: body.flowerTypes || ['Hoa Hồng Nhập Khẩu', 'Hoa Baby'],
              rating: 5.0,
              reviewsCount: 0,
              freshDays: Number(body.freshDays) || 4,
              isAvailable: true,
              createdAt: new Date().toISOString()
            };
            products.unshift(newProduct);
            writeJson('products.json', products);
            broadcastAdminEvent({ type: 'PRODUCT_UPDATED', product: newProduct });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: newProduct }));
            return;
          }
        }

        if (url.startsWith('/api/products/')) {
          const id = url.replace('/api/products/', '').split('/')[0];
          const products = readJson('products.json') || [];
          const index = products.findIndex(p => p.id === id);

          if (req.method === 'PUT' && index !== -1) {
            const body = await readBody();
            products[index] = { ...products[index], ...body };
            writeJson('products.json', products);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: products[index] }));
            return;
          }

          if (req.method === 'PATCH' && url.endsWith('/toggle') && index !== -1) {
            products[index].isAvailable = !products[index].isAvailable;
            writeJson('products.json', products);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: products[index] }));
            return;
          }

          if (req.method === 'DELETE' && index !== -1) {
            const filtered = products.filter(p => p.id !== id);
            writeJson('products.json', filtered);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, message: 'Đã xóa' }));
            return;
          }
        }

        // 5. Orders API
        if (url === '/api/orders') {
          if (req.method === 'GET') {
            const orders = readJson('orders.json') || [];
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: orders }));
            return;
          }
          if (req.method === 'POST') {
            const body = await readBody();
            const orders = readJson('orders.json') || [];
            const newOrderCode = `FB-${Math.floor(10000 + Math.random() * 90000)}`;
            const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            const newOrder = {
              id: newOrderCode,
              orderCode: newOrderCode,
              customerName: body.customerName || body.senderName || 'Khách hàng',
              customerPhone: body.customerPhone || body.senderPhone || '0901 234 567',
              receiverName: body.receiverName || 'Người nhận hoa',
              receiverPhone: body.receiverPhone || '0988 765 432',
              receiverAddress: body.receiverAddress || 'Quận 1, TP.HCM',
              isAnonymous: Boolean(body.isAnonymous),
              productName: body.productName || 'Bó hoa tươi nghệ thuật',
              cardMessage: body.cardMessage || 'Gửi gắm yêu thương!',
              senderSign: body.senderSign || body.senderName || 'Người gửi',
              deliverySlot: body.deliverySlot || 'Hỏa tốc 90 phút',
              totalAmount: Number(body.totalAmount) || 850000,
              status: 'ARRANGING',
              florist: 'Thợ cắm hoa Minh Thư (Studio A)',
              floristAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              proofPhotoUrl: body.proofPhotoUrl || null,
              isApproved: false,
              createdAt: currentTime,
              items: body.items || []
            };

            orders.unshift(newOrder);
            writeJson('orders.json', orders);
            broadcastAdminEvent({ type: 'NEW_ORDER', order: newOrder });

            // Tự động gửi thông báo Telegram từ Server nếu đã lưu settings
            const settings = readJson('settings.json') || {};
            const botToken = body.telegramBotToken || settings.telegramBotToken;
            const chatId = body.telegramChatId || settings.telegramChatId;
            if (botToken && chatId) {
              sendTelegramMessage(botToken, chatId, newOrder).catch(() => {});
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: newOrder }));
            return;
          }
        }

        if (url.startsWith('/api/orders/') && url.endsWith('/status')) {
          const id = url.replace('/api/orders/', '').replace('/status', '');
          const orders = readJson('orders.json') || [];
          const index = orders.findIndex(o => o.id === id || o.orderCode === id);
          if (index !== -1) {
            const body = await readBody();
            orders[index] = { ...orders[index], ...body };
            writeJson('orders.json', orders);
            broadcastAdminEvent({ type: 'ORDER_STATUS_CHANGED', order: orders[index] });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: orders[index] }));
            return;
          }
        }

        // 6. Inventory API
        if (url === '/api/inventory') {
          if (req.method === 'GET') {
            const inventory = readJson('inventory.json') || [];
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: inventory }));
            return;
          }
          if (req.method === 'PUT') {
            const body = await readBody();
            writeJson('inventory.json', body);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: body }));
            return;
          }
        }

        // 7. Telegram Test & ChatID API trong Vite
        if (url === '/api/notifications/telegram-test' && req.method === 'POST') {
          const body = await readBody();
          const token = (body.botToken || '').trim().replace(/^bot/i, '');
          const chatId = String(body.chatId || '').trim();
          const ok = await sendTelegramMessage(token, chatId, body.testOrder || {
            orderCode: 'FB-TEST-2026',
            customerName: 'Anh Hoàng Nam',
            productName: 'Bó Hoa Juliet Nắng Ban Mai',
            totalAmount: 850000,
            deliverySlot: '14:00 - 16:00 Hôm nay',
            receiverAddress: 'Bitexco, Q.1'
          });
          res.setHeader('Content-Type', 'application/json');
          if (ok) {
            res.end(JSON.stringify({ success: true, message: '🎉 Đã gửi tin nhắn thông báo đến Telegram thành công!' }));
          } else {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, message: 'Không thể gửi tin nhắn Telegram. Vui lòng kiểm tra lại Token và đảm bảo bạn đã bấm START bot.' }));
          }
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), fullstackApiPlugin()],
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
});
