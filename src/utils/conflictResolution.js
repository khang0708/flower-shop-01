// src/utils/conflictResolution.js
// Máy chủ là NGUỒN SỰ THẬT cho danh sách sản phẩm. Trình duyệt chỉ giữ cache để hiển thị nhanh.

// Sản phẩm chỉ có ở local được giữ lại trong khoảng này (đang chờ lưu lên server).
export const RECENT_LOCAL_WINDOW_MS = 15000;

const LEGACY_DELETED_KEY = 'flora_deleted_product_ids';

// Sản phẩm đang chờ server xác nhận xóa: ẩn tạm khỏi danh sách. Chỉ lưu trong bộ nhớ,
// không lưu localStorage để không bao giờ có "dấu đã xóa" kẹt lại ở một trình duyệt.
const pendingDeleteIds = new Set();

export const getDeletedProductIds = () => new Set(pendingDeleteIds);

export const markProductDeletedLocal = (productId) => {
  pendingDeleteIds.add(productId);
};

export const unmarkProductDeletedLocal = (productId) => {
  pendingDeleteIds.delete(productId);
};

// Bản cũ lưu dấu đã xóa vào localStorage của admin và ẩn sản phẩm mãi mãi; dọn đi.
export const purgeLegacyDeletedMarks = () => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(LEGACY_DELETED_KEY);
  } catch (e) {}
};

const toTime = (value) => {
  const t = value ? new Date(value).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
};

export const mergeProductsWithConflictResolution = (localProducts, serverProducts, options = {}) => {
  const {
    now = Date.now(),
    recentWindowMs = RECENT_LOCAL_WINDOW_MS,
    pendingIds = pendingDeleteIds
  } = options;

  const safeLocal = Array.isArray(localProducts) ? localProducts : [];
  const safeServer = Array.isArray(serverProducts) ? serverProducts : [];

  const localById = new Map();
  safeLocal.forEach((lp) => {
    if (lp && lp.id) localById.set(lp.id, lp);
  });

  // 1. Kết quả = đúng danh sách server (kể cả rỗng). Cả hai bên cùng có: bản updatedAt mới hơn hẳn thắng.
  const seen = new Set();
  const fromServer = [];
  safeServer.forEach((sp) => {
    if (!sp || !sp.id || seen.has(sp.id) || pendingIds.has(sp.id)) return;
    seen.add(sp.id);
    const lp = localById.get(sp.id);
    fromServer.push(lp && toTime(lp.updatedAt) > toTime(sp.updatedAt) ? lp : sp);
  });

  // 2. Sản phẩm chỉ có ở local: chỉ giữ nếu vừa tạo trong cửa sổ chờ lưu, còn lại là đã bị xóa/không tồn tại trên server.
  const recentLocalOnly = [];
  safeLocal.forEach((lp) => {
    if (!lp || !lp.id || seen.has(lp.id) || pendingIds.has(lp.id)) return;
    const t = toTime(lp.updatedAt) || toTime(lp.createdAt);
    const age = now - t;
    if (t > 0 && age < recentWindowMs && age > -recentWindowMs) {
      seen.add(lp.id);
      recentLocalOnly.push(lp);
    }
  });

  return [...recentLocalOnly, ...fromServer];
};
