// Ảnh do admin tải lên: data URI (vừa chọn file) hoặc đường dẫn ảnh riêng mà server trả thay cho data URI.
const OWN_IMAGE_URL = /^\/api\/products\/[^/?#]+\/image(?:[?#]|$)/;

// Các cỡ ảnh thu nhỏ mà server hỗ trợ (phải khớp THUMB_WIDTHS ở server/server.js)
const THUMB_WIDTHS = [240, 480, 800, 1200];

export const isCustomProductImage = (image) =>
  typeof image === 'string' && (image.startsWith('data:image/') || OWN_IMAGE_URL.test(image));

const pickWidth = (width) => THUMB_WIDTHS.find((w) => w >= width) || THUMB_WIDTHS[THUMB_WIDTHS.length - 1];

// URL ảnh thu nhỏ cho ảnh do server phục vụ; ảnh khác (link ngoài, ảnh tĩnh, data URI) giữ nguyên
export const productImageUrl = (image, width) => {
  if (typeof image !== 'string' || !OWN_IMAGE_URL.test(image) || /[?&]w=/.test(image)) return image;
  return `${image}${image.includes('?') ? '&' : '?'}w=${pickWidth(width)}`;
};

// srcSet để trình duyệt tự chọn cỡ ảnh phù hợp màn hình; undefined nếu không phải ảnh do server phục vụ
export const productImageSrcSet = (image, widths = [480, 800, 1200]) => {
  if (typeof image !== 'string' || !OWN_IMAGE_URL.test(image)) return undefined;
  return widths.map((w) => `${productImageUrl(image, w)} ${w}w`).join(', ');
};
