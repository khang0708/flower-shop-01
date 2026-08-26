// src/services/notificationService.js
// Quản lý thông báo màn hình hệ điều hành (Browser Push Notification) & BroadcastChannel

const BROADCAST_CHANNEL_NAME = 'flora_admin_notifications';
let broadcastChannel = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported:', e);
  }
}

/**
 * Xin quyền hiển thị thông báo trình duyệt
 */
export const requestBrowserNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Lỗi xin quyền thông báo:', err);
    return 'denied';
  }
};

/**
 * Kiểm tra trạng thái quyền thông báo hiện tại
 */
export const getBrowserNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * Đẩy thông báo ra màn hình hệ thống (macOS, Windows, Android)
 */
export const showBrowserOrderNotification = (order) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const title = `🌸 ĐƠN HOA MỚI #${order.orderCode || order.id}!`;
    const customer = order.customerName || 'Khách hàng';
    const amount = Number(order.totalAmount || 0).toLocaleString('vi-VN') + 'đ';
    const slot = order.deliverySlot || 'Giao trong ngày';
    const product = order.productName || 'Bó hoa tươi';

    const options = {
      body: `${customer} vừa đặt "${product}" (${amount}). Khung giờ hẹn: ${slot}.`,
      icon: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=192&q=80',
      badge: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=96&q=80',
      tag: `order-${order.id}`,
      renotify: true,
      requireInteraction: true,
    };

    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      window.location.hash = 'admin';
      notif.close();
    };
  } catch (err) {
    console.warn('Lỗi gửi Browser Notification:', err);
  }
};

/**
 * Phát sự kiện đơn mới qua các tab trình duyệt khác
 */
export const broadcastNewOrderToTabs = (order) => {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'NEW_ORDER', order });
  }
};

/**
 * Phát sự kiện cập nhật đơn hàng (ảnh chụp thật, trạng thái) qua các tab khác
 */
export const broadcastOrderUpdateToTabs = (orderId, updates) => {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'UPDATE_ORDER', orderId, updates });
  }
};

/**
 * Lắng nghe sự kiện đơn mới & cập nhật đơn từ các tab khác
 */
export const listenToCrossTabOrders = (onNewOrder, onUpdateOrder) => {
  if (!broadcastChannel) return () => {};
  const handler = (event) => {
    if (event.data?.type === 'NEW_ORDER' && event.data.order) {
      if (typeof onNewOrder === 'function') onNewOrder(event.data.order);
    }
    if (event.data?.type === 'UPDATE_ORDER' && event.data.orderId) {
      if (typeof onUpdateOrder === 'function') onUpdateOrder(event.data.orderId, event.data.updates);
    }
  };
  broadcastChannel.addEventListener('message', handler);
  return () => {
    broadcastChannel.removeEventListener('message', handler);
  };
};
