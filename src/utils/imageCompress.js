// Nén ảnh admin tải lên trước khi lưu: ảnh chụp điện thoại 5-8MB chỉ cần ~1600px là đủ cho mọi màn hình.
const readAsDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không đọc được ảnh')); };
    img.src = url;
  });

// Trả về data URI. Bất kỳ lỗi nào (hoặc bản nén không nhỏ hơn) thì dùng nguyên ảnh gốc.
export const compressImageToDataUrl = async (file, { maxEdge = 1600, quality = 0.85, skipUnderBytes = 400 * 1024 } = {}) => {
  // Giữ nguyên SVG/GIF (không nén được an toàn) và ảnh đã nhỏ
  if (!/^image\/(jpeg|png|webp|bmp)$/i.test(file.type) || file.size <= skipUnderBytes) {
    return readAsDataUrl(file);
  }
  try {
    // drawImage áp dụng hướng xoay EXIF của ảnh chụp điện thoại nên ảnh nén luôn đúng chiều
    const img = await loadImage(file);
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob && blob.size < file.size) return readAsDataUrl(blob);
  } catch (e) {
    console.warn('Không nén được ảnh, dùng ảnh gốc:', e && e.message);
  }
  return readAsDataUrl(file);
};
