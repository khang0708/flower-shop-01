/**
 * Ngọc Flower - Facebook Messenger Service
 * Tiện ích kết nối, mở liên kết m.me và xử lý tương tác qua Facebook Messenger
 */

/**
 * Chuẩn hóa Facebook Page ID hoặc Fanpage Username
 * Loại bỏ dấu @, khoảng trắng hoặc tiền tố m.me/ / facebook.com/
 */
export const cleanFacebookPageId = (rawInput) => {
  if (!rawInput) return 'tiemhoaflorabloom';
  return String(rawInput)
    .trim()
    .replace(/^https?:\/\/(www\.)?(facebook\.com|m\.me)\//i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '')
    .trim();
};

/**
 * Tạo URL m.me chuẩn mở cuộc trò chuyện Messenger
 * @param {string} pageId - Fanpage ID hoặc Username
 * @param {string} [refOrText] - Tin nhắn mẫu hoặc tham số ref
 */
export const getMessengerUrl = (pageId, refOrText = '') => {
  const cleanId = cleanFacebookPageId(pageId);
  if (!refOrText) {
    return `https://m.me/${cleanId}`;
  }
  // Nếu là chuỗi text thông thường, encode param text
  return `https://m.me/${cleanId}?text=${encodeURIComponent(refOrText)}`;
};

/**
 * Mở trực tiếp cuộc trò chuyện Messenger trong tab mới hoặc App Messenger
 */
export const openFacebookMessenger = (pageId, message = '') => {
  const url = getMessengerUrl(pageId, message);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return url;
};

/**
 * Tạo link Messenger tư vấn mẫu hoa cụ thể
 */
export const generateMessengerProductInquiry = (pageId, product) => {
  if (!product) return openFacebookMessenger(pageId);
  const priceStr = Number(product.price || 0).toLocaleString('vi-VN');
  const message = `Chào Ngọc Flower, tôi muốn tư vấn mẫu hoa "${product.name}" (giá: ${priceStr}đ). Nhờ tiệm gửi thêm ảnh hoa thực tế tại xưởng giúp tôi nhé!`;
  return openFacebookMessenger(pageId, message);
};

/**
 * Tạo link Messenger tra cứu đơn hoa hoặc gửi phản hồi cắm hoa
 */
export const generateMessengerOrderInquiry = (pageId, orderCode) => {
  const code = orderCode || 'FB-XXXXX';
  const message = `Chào shop, tôi muốn hỏi về tiến trình cắm hoa của đơn hàng #${code}. Cho tôi xem ảnh hoa thực tế trước khi ship với ạ!`;
  return openFacebookMessenger(pageId, message);
};

/**
 * Tạo link Messenger gửi mẫu hoa AI đã phân tích
 */
export const generateMessengerAIInquiry = (pageId, analysisResult) => {
  const detected = analysisResult?.detectedFlowers?.join(', ') || 'Hoa thiết kế theo ảnh';
  const style = analysisResult?.style || 'Nghệ thuật';
  const message = `Chào nghệ nhân Ngọc Flower, tôi vừa dùng AI Florist Vision thẩm định mẫu hoa phong cách "${style}" (${detected}). Nhờ xưởng báo giá và tư vấn cắm mẫu này giúp tôi nhé!`;
  return openFacebookMessenger(pageId, message);
};
