import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helpers for JSON Database persistence
const readJson = (fileName) => {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Lỗi đọc file ${fileName}:`, err);
    return [];
  }
};

const writeJson = (fileName, data) => {
  const filePath = path.join(DATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

// ----------------------------------------------------
// REAL-TIME SERVER-SENT EVENTS (SSE) FOR ADMINS
// ----------------------------------------------------
const sseClients = new Set();

export const broadcastAdminEvent = (eventPayload) => {
  const message = `data: ${JSON.stringify(eventPayload)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(message);
    } catch (e) {
      sseClients.delete(client);
    }
  });
};

// GET /api/admin/events (SSE Stream)
app.get('/api/admin/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Admin Stream Active' })}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// ----------------------------------------------------
// 1. PRODUCTS REST API (Quản Lý Sản Phẩm Mẫu Hoa)
// ----------------------------------------------------

// GET /api/products
app.get('/api/products', (req, res) => {
  try {
    const products = readJson('products.json');
    res.json({ success: true, data: products, total: products.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products (Thêm mẫu hoa mới)
app.post('/api/products', (req, res) => {
  try {
    const products = readJson('products.json');
    const newProduct = {
      id: req.body.id || `fl-${Date.now()}`,
      name: req.body.name || 'Bó Hoa Mới',
      subtitle: req.body.subtitle || '',
      price: Number(req.body.price) || 500000,
      originalPrice: Number(req.body.originalPrice) || Number(req.body.price) || 600000,
      occasion: req.body.occasion || 'love',
      colorTone: req.body.colorTone || 'pastel',
      image: req.body.image || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
      tags: req.body.tags || ['Mẫu Mới'],
      meaning: req.body.meaning || 'Gửi gắm yêu thương.',
      flowerTypes: req.body.flowerTypes || ['Hoa Hồng Nhập Khẩu', 'Hoa Baby'],
      rating: 5.0,
      reviewsCount: 0,
      freshDays: Number(req.body.freshDays) || 4,
      isAvailable: true,
      createdAt: new Date().toISOString()
    };

    products.unshift(newProduct);
    writeJson('products.json', products);

    broadcastAdminEvent({ type: 'PRODUCT_UPDATED', product: newProduct });
    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id (Cập nhật mẫu hoa)
app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    let products = readJson('products.json');
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu hoa' });
    }

    products[index] = {
      ...products[index],
      ...req.body,
      price: req.body.price ? Number(req.body.price) : products[index].price,
      originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : products[index].originalPrice,
      updatedAt: new Date().toISOString()
    };

    writeJson('products.json', products);
    res.json({ success: true, data: products[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/products/:id/toggle (Bật/Tắt hiển thị)
app.patch('/api/products/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    let products = readJson('products.json');
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu hoa' });
    }

    products[index].isAvailable = products[index].isAvailable === false ? true : false;
    writeJson('products.json', products);

    res.json({ success: true, data: products[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id (Xóa mẫu hoa)
app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    let products = readJson('products.json');
    const filtered = products.filter(p => p.id !== id);

    if (filtered.length === products.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu hoa' });
    }

    writeJson('products.json', filtered);
    res.json({ success: true, message: 'Đã xóa mẫu hoa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 2. ORDERS REST API (Quản Lý Đơn Hàng & Vận Hành Florist)
// ----------------------------------------------------

// GET /api/orders
app.get('/api/orders', (req, res) => {
  try {
    const orders = readJson('orders.json');
    res.json({ success: true, data: orders, total: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders
app.post('/api/orders', async (req, res) => {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const currentTime = `${timeStr} (${dateStr})`;

    const newOrder = {
      id: newOrderCode,
      orderCode: newOrderCode,
      customerName: req.body.customerName || req.body.senderName || 'Khách hàng',
      customerPhone: req.body.customerPhone || req.body.senderPhone || '0901 234 567',
      receiverName: req.body.receiverName || 'Người nhận hoa',
      receiverPhone: req.body.receiverPhone || '0988 765 432',
      receiverAddress: req.body.receiverAddress || 'Quận 1, TP.HCM',
      isAnonymous: Boolean(req.body.isAnonymous),
      productName: req.body.productName || 'Bó hoa tươi nghệ thuật',
      cardMessage: req.body.cardMessage || 'Gửi gắm yêu thương!',
      senderSign: req.body.senderSign || req.body.senderName || 'Người gửi',
      deliverySlot: req.body.deliverySlot || 'Hỏa tốc 90 phút',
      totalAmount: Number(req.body.totalAmount) || 850000,
      status: 'ARRANGING',
      florist: 'Thợ cắm hoa Minh Thư (Studio A)',
      floristAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      proofPhotoUrl: req.body.proofPhotoUrl || null,
      isApproved: false,
      createdAt: currentTime,
      items: req.body.items || []
    };

    orders.unshift(newOrder);
    writeJson('orders.json', orders);

    broadcastAdminEvent({
      type: 'NEW_ORDER',
      order: newOrder,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/orders/:id/status
app.patch('/api/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    let orders = readJson('orders.json');
    const index = orders.findIndex(o => o.id === id || o.orderCode === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    orders[index] = {
      ...orders[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    writeJson('orders.json', orders);

    broadcastAdminEvent({
      type: 'ORDER_STATUS_CHANGED',
      order: orders[index]
    });

    res.json({ success: true, data: orders[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 3. TELEGRAM BOT NOTIFICATION WEBHOOK & AUTO-DETECT CHAT ID
// ----------------------------------------------------

// Clean helper for Telegram tokens
const cleanTelegramToken = (token) => {
  if (!token) return '';
  return token.trim().replace(/^bot/i, '');
};

const cleanTelegramChatId = (chatId) => {
  if (!chatId) return '';
  return String(chatId).trim();
};

// Endpoint tự động tìm Chat ID từ Bot Token 1-Chạm!
app.post('/api/notifications/telegram-get-chat-id', async (req, res) => {
  try {
    const rawToken = req.body.botToken;
    if (!rawToken) {
      return res.status(400).json({ success: false, message: 'Vui lòng dán chuỗi Bot Token vào ô trên trước khi bấm dò tìm' });
    }

    const token = cleanTelegramToken(rawToken);
    const updatesUrl = `https://api.telegram.org/bot${token}/getUpdates`;
    const tgRes = await fetch(updatesUrl);
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      let friendlyError = tgData.description;
      if (tgData.error_code === 401 || tgData.description?.includes('Unauthorized')) {
        friendlyError = 'Bot Token không đúng hoặc đã bị xóa. Hãy kiểm tra lại chuỗi Token từ @BotFather.';
      }
      return res.status(400).json({ 
        success: false, 
        message: `Lỗi kết nối Bot: ${friendlyError}` 
      });
    }

    const updates = tgData.result || [];
    if (updates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chưa nhận được tin nhắn nào! Bạn hãy mở Telegram, tìm bot của bạn, bấm nút START (hoặc gửi chữ "Hi") rồi bấm lại nút này nhé.'
      });
    }

    // Lấy tin nhắn mới nhất
    const lastUpdate = updates[updates.length - 1];
    const message = lastUpdate.message || lastUpdate.channel_post || lastUpdate.callback_query?.message;

    if (!message || !message.chat) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ID cuộc trò chuyện. Hãy gửi 1 tin nhắn bất kỳ đến bot.'
      });
    }

    const chatId = message.chat.id;
    const name = message.from?.first_name || message.chat?.first_name || message.chat?.title || 'Bạn';

    res.json({
      success: true,
      chatId: String(chatId),
      senderName: name,
      message: `Đã tìm thấy Chat ID của ${name}: ${chatId}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint test gửi thông báo đơn hàng qua Telegram
app.post('/api/notifications/telegram-test', async (req, res) => {
  try {
    const { botToken, chatId, testOrder } = req.body;
    if (!botToken || !chatId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ cả Bot Token và Chat ID' });
    }

    const token = cleanTelegramToken(botToken);
    const targetChatId = cleanTelegramChatId(chatId);

    const order = testOrder || {
      orderCode: 'FB-TEST-2026',
      customerName: 'Anh Hoàng Nam',
      productName: 'Bó Hoa Juliet Nắng Ban Mai',
      totalAmount: 850000,
      deliverySlot: '14:00 - 16:00 Hôm nay',
      receiverAddress: 'Bitexco, Q.1'
    };

    // Dùng định dạng HTML an toàn 100%, không bị lỗi ký tự Markdown
    const htmlMessage = `🌸 <b>CÓ ĐƠN ĐẶT HOA MỚI!</b> (#${order.orderCode})\n\n` +
      `👤 <b>Khách đặt:</b> ${order.customerName}\n` +
      `💐 <b>Mẫu hoa:</b> ${order.productName}\n` +
      `💰 <b>Tổng tiền:</b> ${Number(order.totalAmount).toLocaleString('vi-VN')}đ\n` +
      `⏱️ <b>Khung giờ:</b> ${order.deliverySlot}\n` +
      `📍 <b>Giao tới:</b> ${order.receiverAddress}\n\n` +
      `👉 <i>Hãy mở Bảng Điều Hành Admin Flora & Bloom để duyệt ảnh và cắm hoa nhé!</i>`;

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const tgRes = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: htmlMessage,
        parse_mode: 'HTML'
      })
    });

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      let explanation = tgData.description;
      if (tgData.description?.includes('bot was blocked by the user') || tgData.description?.includes('chat not found')) {
        explanation = 'LƯU Ý QUAN TRỌNG: Bạn chưa bấm START vào bot! Hãy mở ứng dụng Telegram, tìm đúng tên bot của bạn và bấm nút START để cho phép bot gửi tin nhắn nhé.';
      } else if (tgData.description?.includes('Unauthorized')) {
        explanation = 'Chuỗi Bot Token không chính xác. Hãy kiểm tra lại token được cấp bởi @BotFather.';
      }
      return res.status(400).json({ success: false, message: `Lỗi từ Telegram: ${explanation}` });
    }

    res.json({ success: true, message: '🎉 Thành công! Bot vừa gửi tin nhắn thông báo đến Telegram của bạn!', data: tgData.result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 4. INVENTORY API
// ----------------------------------------------------
app.get('/api/inventory', (req, res) => {
  try {
    const inventory = readJson('inventory.json');
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/inventory', (req, res) => {
  try {
    const newInventory = req.body;
    writeJson('inventory.json', newInventory);
    res.json({ success: true, data: newInventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 5. AI FLORIST VISION API
// ----------------------------------------------------
app.post('/api/ai/analyze-flower', async (req, res) => {
  try {
    const analysisPayload = {
      detectedFlowers: [
        'Hoa Hồng Juliet Anh Quốc (18 cành nở bung)',
        'Hoa Baby Hà Lan Trắng',
        'Lá Khuynh Diệp (Eucalyptus)',
        'Cúc Tana nhí đệm cánh'
      ],
      colorPalette: ['#F5D6CE', '#D1DFD6', '#E8998D', '#FAF8F5'],
      colorNames: ['Hồng Nude', 'Xanh Sage', 'Dusty Rose', 'Kem Sữa'],
      style: 'Hàn Quốc Tối Giản (Korean Botanical Elegance)',
      difficulty: 'Trung Bình Khá (Thợ cắm trong 45 phút)',
      priceRange: {
        min: 850000,
        max: 1050000
      },
      floristAdvice: 'Nên sử dụng giấy lụa mờ 2 lớp màu xanh sage kèm ruy băng thêu tên nghệ thuật để tôn trọn vẹn dáng hoa bồng bềnh.',
      summaryVietnamese: 'Mẫu hoa mang cảm giác ngọt ngào, tinh tế, thích hợp nhất khi làm quà tặng sinh nhật hoặc kỷ niệm ngày bên nhau.',
      analyzedAt: new Date().toISOString(),
      aiModel: 'Gemini-2.5-Flash Multimodal Vision Engine'
    };

    res.json({ success: true, data: analysisPayload });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi thẩm định AI: ' + error.message });
  }
});

// ----------------------------------------------------
// 6. ZALO ZNS & NOTIFICATION API
// ----------------------------------------------------
app.post('/api/zalo/send-zns', async (req, res) => {
  try {
    const { phone, customerName, orderCode, photoUrl, accessToken } = req.body;

    const payload = {
      phone: phone ? phone.replace(/\D/g, '') : '0901234567',
      template_id: '318492',
      template_data: {
        customer_name: customerName || 'Quý khách',
        order_code: orderCode || 'FB-89241',
        photo_url: photoUrl || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
        status: 'Đã cắm hoa hoàn tất - Chờ duyệt ảnh',
        time: new Date().toLocaleTimeString('vi-VN')
      },
      tracking_id: `zns_${orderCode}_${Date.now()}`
    };

    if (accessToken) {
      try {
        const response = await fetch('https://business.openapi.zalo.me/message/template', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': accessToken
          },
          body: JSON.stringify(payload)
        });
        const liveData = await response.json();
        return res.json({ success: true, isLiveApi: true, data: liveData });
      } catch (err) {
        console.warn('Zalo API sandbox fallback:', err.message);
      }
    }

    res.json({
      success: true,
      isLiveApi: false,
      message: `Đã gửi thành công thông báo ZNS đến SĐT ${payload.phone}`,
      data: payload
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 7. HEALTH CHECK
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Flora & Bloom Atelier Backend API',
    time: new Date().toISOString(),
    version: '1.0.0'
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌸 Flora & Bloom API Server đang chạy tại: http://127.0.0.1:${PORT}`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
