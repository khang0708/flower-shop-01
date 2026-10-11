// Ảnh do admin tải lên: data URI (vừa chọn file) hoặc đường dẫn ảnh riêng mà server trả thay cho data URI.
const OWN_IMAGE_URL = /^\/api\/products\/[^/?#]+\/image(?:[?#]|$)/;

export const isCustomProductImage = (image) =>
  typeof image === 'string' && (image.startsWith('data:image/') || OWN_IMAGE_URL.test(image));
