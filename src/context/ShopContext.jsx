import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FLOWERS_DATA } from '../data/flowers';
import { 
  fetchProductsApi, 
  createProductApi, 
  updateProductApi, 
  deleteProductApi, 
  toggleProductApi,
  fetchOrdersApi,
  createOrderApi,
  updateOrderStatusApi,
  fetchInventoryApi,
  checkHealthApi,
  sendTelegramTestApi,
  sendTelegramOrderNotificationApi,
  fetchSettingsApi,
  saveSettingsApi,
  fetchDiscountsApi,
  validateDiscountApi,
  createDiscountApi,
  toggleDiscountApi,
  deleteDiscountApi,
  fetchReviewsApi,
  createReviewApi,
  toggleReviewApi,
  deleteReviewApi
} from '../api';
import { playNewOrderChime } from '../services/soundService';
import { 
  showBrowserOrderNotification, 
  broadcastNewOrderToTabs, 
  broadcastOrderUpdateToTabs,
  broadcastProductUpdateToTabs,
  broadcastProductAddToTabs,
  broadcastProductDeleteToTabs,
  listenToCrossTabOrders 
} from '../services/notificationService';

const ShopContext = createContext();

const INITIAL_ORDERS = [
  {
    id: 'FB-89241',
    orderCode: 'FB-89241',
    customerName: 'Nguyễn Hoàng Nam',
    customerPhone: '0909 123 456',
    receiverName: 'Trần Ngọc Bích',
    receiverPhone: '0988 765 432',
    receiverAddress: '124 Phan Chu Trinh, Phường Thắng Lợi, TP. Buôn Ma Thuột',
    isAnonymous: true,
    productName: 'Bó Hoa "Juliet Nắng Ban Mai" (Size Tiêu Chuẩn)',
    cardMessage: 'Chúc em một ngày sinh nhật rực rỡ và luôn nở nụ cười thật tươi! 🌸',
    senderSign: 'Người thương em',
    deliverySlot: '14:00 - 16:00 Hôm nay',
    totalAmount: 1000000,
    status: 'PHOTO_READY',
    florist: 'Thợ cắm hoa Minh Thư',
    floristAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    proofPhotoUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
    isApproved: false,
    createdAt: '09:30',
    items: [
      { name: 'Bó Hoa "Juliet Nắng Ban Mai" (Size Tiêu Chuẩn)', price: 850000 },
      { name: 'Nến Thơm Tinh Dầu Organic', price: 150000 }
    ]
  },
  {
    id: 'FB-89242',
    orderCode: 'FB-89242',
    customerName: 'Lê Thu Trang',
    customerPhone: '0912 345 678',
    receiverName: 'Công ty CP Công Nghệ Nova',
    receiverPhone: '028 3822 9999',
    receiverAddress: 'Lầu 8, Vincom Center, 72 Lê Thánh Tôn, Q.1',
    isAnonymous: false,
    productName: 'Giỏ Hoa "Ánh Kim Khai Vận" (Size Deluxe)',
    cardMessage: 'Kính chúc Quý Công ty khai trương hồng phát, vạn sự hanh thông!',
    senderSign: 'Tập thể Nova',
    deliverySlot: '⚡ Hỏa tốc 90 phút',
    totalAmount: 1687000,
    status: 'ARRANGING',
    florist: 'Nghệ nhân Hoàng Nam',
    floristAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    proofPhotoUrl: null,
    isApproved: false,
    createdAt: '10:05',
    items: [{ name: 'Giỏ Hoa "Ánh Kim Khai Vận"', price: 1687000 }]
  }
];

// ----------------------------------------------------
// LOCAL-FIRST & CONFLICT RESOLUTION UTILITIES
// Ngăn stale server container Vercel ghi đè dữ liệu mới
// ----------------------------------------------------
import { 
  getDeletedProductIds, 
  markProductDeletedLocal, 
  unmarkProductDeletedLocal, 
  mergeProductsWithConflictResolution 
} from '../utils/conflictResolution';

export { 
  getDeletedProductIds, 
  markProductDeletedLocal, 
  unmarkProductDeletedLocal, 
  mergeProductsWithConflictResolution 
};

export const ShopProvider = ({ children }) => {
  // 1. Quản lý danh mục mẫu hoa (Ưu tiên cache LocalStorage để storefront cập nhật ngay, fallback FLOWERS_DATA)
  const [products, setProductsState] = useState(() => {
    try {
      const cached = localStorage.getItem('flora_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = parsed.map(p => ({
            ...p,
            category: p.category || 'flowers'
          }));
          const existingIds = new Set(migrated.map(p => p.id));
          const missingNewItems = FLOWERS_DATA.filter(item => !existingIds.has(item.id));
          return [...migrated, ...missingNewItems];
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc cache flora_products:', e);
    }
    return FLOWERS_DATA;
  });

  const updateProductsLocalAndBroadcast = useCallback((updater, broadcastAction = null) => {
    setProductsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('flora_products', JSON.stringify(next));
      } catch (e) {
        console.warn('Lỗi lưu flora_products vào localStorage:', e);
      }
      return next;
    });
    if (typeof broadcastAction === 'function') {
      broadcastAction();
    }
  }, []);

  const [isApiConnected, setIsApiConnected] = useState(false);

  // Helper quản lý mốc thời gian cập nhật cài đặt
  const updateSettingsTimestamp = () => {
    const now = new Date().toISOString();
    try {
      localStorage.setItem('flora_settings_updated_at', now);
    } catch (e) {}
    return now;
  };

  // 2. Cài đặt kết nối Zalo Cá Nhân / Telegram (Lưu bền vững vào LocalStorage & Backend Settings)
  const [shopZaloPhone, setShopZaloPhoneState] = useState(() => {
    return localStorage.getItem('flora_shop_zalo_phone') || '0387970583';
  });
  const [shopAddress, setShopAddressState] = useState(() => {
    return localStorage.getItem('flora_shop_address') || '44 Đỗ Nhuận, Phường Buôn Ma Thuột, Đắk Lắk';
  });
  const [zaloModeType, setZaloModeType] = useState('personal');

  const [telegramBotToken, setTelegramBotTokenState] = useState(() => {
    return localStorage.getItem('flora_tg_token') || '';
  });
  const [telegramChatId, setTelegramChatIdState] = useState(() => {
    return localStorage.getItem('flora_tg_chat_id') || '';
  });

  const setShopZaloPhone = (val) => {
    const clean = (val || '').trim();
    const now = updateSettingsTimestamp();
    setShopZaloPhoneState(clean);
    localStorage.setItem('flora_shop_zalo_phone', clean);
    saveSettingsApi({ shopZaloPhone: clean, updatedAt: now }).catch(() => {});
  };

  const setShopAddress = (val) => {
    const clean = (val || '').trim();
    const now = updateSettingsTimestamp();
    setShopAddressState(clean);
    localStorage.setItem('flora_shop_address', clean);
    saveSettingsApi({ shopAddress: clean, updatedAt: now }).catch(() => {});
  };

  const setTelegramBotToken = (val) => {
    const now = updateSettingsTimestamp();
    setTelegramBotTokenState(val);
    localStorage.setItem('flora_tg_token', val);
    saveSettingsApi({ telegramBotToken: val, updatedAt: now }).catch(() => {});
  };

  const setTelegramChatId = (val) => {
    const now = updateSettingsTimestamp();
    setTelegramChatIdState(val);
    localStorage.setItem('flora_tg_chat_id', val);
    saveSettingsApi({ telegramChatId: val, updatedAt: now }).catch(() => {});
  };

  // 3. Quản lý thông báo Admin Real-time
  const [isSoundEnabled, setIsSoundEnabledState] = useState(() => {
    return localStorage.getItem('flora_sound_enabled') !== 'false';
  });

  const setIsSoundEnabled = (val) => {
    const now = updateSettingsTimestamp();
    setIsSoundEnabledState(val);
    localStorage.setItem('flora_sound_enabled', String(val));
    saveSettingsApi({ isSoundEnabled: val, updatedAt: now }).catch(() => {});
  };

  // 3.1. Cấu hình Phí Giao Hoa & Freeship (Xử lý linh hoạt qua Admin hoặc Tự Động)
  const [shippingSettings, setShippingSettingsState] = useState(() => {
    try {
      const cached = localStorage.getItem('flora_shipping_settings');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      shippingMode: 'admin_confirm', // 'admin_confirm' (Tiệm xác nhận báo ship) | 'auto' (Tự động theo bảng giá)
      standardFee: 35000,
      expressFee: 60000,
      freeShippingThreshold: 1000000,
      isFreeShippingEnabled: true,
      freeShippingNote: 'Shop sẽ kiểm tra địa chỉ & xác nhận phí giao hoa chính xác theo quãng đường thực tế qua Zalo/SĐT'
    };
  });

  const updateShippingSettings = (newSettings) => {
    const now = updateSettingsTimestamp();
    setShippingSettingsState(prev => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem('flora_shipping_settings', JSON.stringify(merged));
      } catch (e) {}
      saveSettingsApi({ shippingSettings: merged, updatedAt: now }).catch(() => {});
      return merged;
    });
  };

  // 3.2. Cấu hình Facebook Fanpage & Messenger
  const [facebookSettings, setFacebookSettingsState] = useState(() => {
    try {
      const cached = localStorage.getItem('flora_facebook_settings');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      pageId: 'tiemhoaflorabloom',
      pageName: 'Ngọc Flower - Tiệm Hoa Tươi Nghệ Thuật',
      pageAccessToken: '',
      verifyToken: 'flora_bloom_webhook_secret_2026',
      adminRecipientId: '',
      isEnabled: true,
      welcomeMessage: 'Chào bạn! Ngọc Flower Studio rất vui được hỗ trợ bạn chọn mẫu hoa tươi ưng ý nhất.',
      autoReplyEnabled: true
    };
  });

  const updateFacebookSettings = (newSettings) => {
    const now = updateSettingsTimestamp();
    setFacebookSettingsState(prev => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem('flora_facebook_settings', JSON.stringify(merged));
      } catch (e) {}
      saveSettingsApi({ facebookSettings: merged, updatedAt: now }).catch(() => {});
      return merged;
    });
  };

  const getShippingFee = useCallback((type = 'timeslot', subtotal = 0) => {
    const { 
      shippingMode = 'admin_confirm', 
      standardFee = 35000, 
      expressFee = 60000, 
      freeShippingThreshold = 1000000, 
      isFreeShippingEnabled = true 
    } = shippingSettings;

    const isFreeship = isFreeShippingEnabled && subtotal >= freeShippingThreshold;
    if (isFreeship) return 0;

    // Chế độ Admin xử lý phí ship: Tạm tính 0đ tại bước đặt hoa, shop báo phí ship thực tế sau
    if (shippingMode === 'admin_confirm') {
      return 0;
    }

    if (type === 'express') {
      return Number(expressFee);
    }

    return Number(standardFee);
  }, [shippingSettings]);

  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [latestNewOrder, setLatestNewOrder] = useState(null);

  // 4. Giỏ hàng & Sản phẩm
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [activeCategory, setActiveCategory] = useState('flowers'); // 'flowers' | 'weddings' | 'fruits'
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedWeddingType, setSelectedWeddingType] = useState('all');
  const [selectedFruitType, setSelectedFruitType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest' | 'name_asc'
  
  // 5. Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAIFloristOpen, setIsAIFloristOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isZaloMode, setIsZaloMode] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // 6. Danh sách đơn hàng (Lưu LocalStorage + REST API đồng bộ)
  const [orders, setOrdersState] = useState(() => {
    try {
      const cached = localStorage.getItem('flora_orders');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return INITIAL_ORDERS;
  });

  const setOrders = (updater) => {
    setOrdersState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('flora_orders', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const [activeOrder, setActiveOrder] = useState(orders[0]);

  // 7. Kho hoa tươi
  const [inventory, setInventory] = useState([
    { name: 'Hoa Hồng Juliet (Ecuador)', total: 120, used: 75, remain: 45, unit: 'cành', status: 'normal' },
    { name: 'Hoa Hồng Đỏ Ruby (Đà Lạt)', total: 200, used: 160, remain: 40, unit: 'cành', status: 'warning' },
    { name: 'Hoa Mẫu Đơn Trắng Nhập', total: 50, used: 42, remain: 8, unit: 'bông', status: 'danger' },
    { name: 'Hoa Baby Hà Lan (Trắng)', total: 30, used: 12, remain: 18, unit: 'bó lớn', status: 'normal' },
    { name: 'Hoa Hướng Dương Lùn', total: 80, used: 35, remain: 45, unit: 'bông', status: 'normal' },
    { name: 'Cẩm Tú Cầu Xanh Lam', total: 40, used: 25, remain: 15, unit: 'bông', status: 'normal' },
  ]);

  // Hàm tính trạng thái tồn kho chuẩn hóa
  const calculateInventoryStatus = (remain) => {
    if (remain <= 5) return 'danger';
    if (remain <= 20) return 'warning';
    return 'normal';
  };

  // Thêm nguyên liệu hoa mới vào kho
  const addInventoryItem = async (itemData) => {
    const total = Math.max(0, Number(itemData.total) || 0);
    const used = Math.max(0, Number(itemData.used) || 0);
    const remain = Math.max(0, total - used);
    const newItem = {
      name: itemData.name.trim(),
      total,
      used,
      remain,
      unit: itemData.unit || 'cành',
      status: calculateInventoryStatus(remain)
    };

    const next = [...inventory.filter(i => i.name.toLowerCase() !== newItem.name.toLowerCase()), newItem];
    setInventory(next);
    try {
      await updateInventoryApi(next);
    } catch (e) {}
    return newItem;
  };

  // Cập nhật/Kiểm kê nguyên liệu hoa
  const updateInventoryItem = async (originalName, updates) => {
    const next = inventory.map(item => {
      if (item.name === originalName) {
        const total = updates.total !== undefined ? Math.max(0, Number(updates.total) || 0) : item.total;
        const used = updates.used !== undefined ? Math.max(0, Number(updates.used) || 0) : item.used;
        const remain = Math.max(0, total - used);
        return {
          ...item,
          ...updates,
          total,
          used,
          remain,
          status: calculateInventoryStatus(remain)
        };
      }
      return item;
    });

    setInventory(next);
    try {
      await updateInventoryApi(next);
    } catch (e) {}
  };

  // Nhập thêm hàng (Restock)
  const restockInventoryItem = async (flowerName, addedQuantity) => {
    const addQty = Math.max(0, Number(addedQuantity) || 0);
    const next = inventory.map(item => {
      if (item.name === flowerName) {
        const total = item.total + addQty;
        const remain = Math.max(0, total - item.used);
        return {
          ...item,
          total,
          remain,
          status: calculateInventoryStatus(remain)
        };
      }
      return item;
    });

    setInventory(next);
    try {
      await updateInventoryApi(next);
    } catch (e) {}
  };

  // Xóa nguyên liệu
  const deleteInventoryItem = async (flowerName) => {
    const next = inventory.filter(item => item.name !== flowerName);
    setInventory(next);
    try {
      await updateInventoryApi(next);
    } catch (e) {}
  };

  // Tự động trừ kho khi có đơn hàng mới (Deduct on Order)
  const deductInventoryOnOrder = async (cartItems) => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return;

    let updated = [...inventory];
    let hasChanges = false;

    cartItems.forEach(cartItem => {
      const qty = Number(cartItem.quantity || 1);
      const itemNameLower = (cartItem.name || '').toLowerCase();

      // Định lượng cành hoa theo từng mẫu
      updated = updated.map(invItem => {
        const invLower = invItem.name.toLowerCase();
        let deductAmount = 0;

        if (itemNameLower.includes('juliet') && invLower.includes('juliet')) {
          deductAmount = 10 * qty;
        } else if ((itemNameLower.includes('ruby') || itemNameLower.includes('đỏ')) && invLower.includes('ruby')) {
          deductAmount = 15 * qty;
        } else if (itemNameLower.includes('mẫu đơn') && invLower.includes('mẫu đơn')) {
          deductAmount = 3 * qty;
        } else if (itemNameLower.includes('hướng dương') && invLower.includes('hướng dương')) {
          deductAmount = 5 * qty;
        } else if (itemNameLower.includes('cẩm tú cầu') && invLower.includes('cẩm tú cầu')) {
          deductAmount = 3 * qty;
        } else if (itemNameLower.includes('baby') && invLower.includes('baby')) {
          deductAmount = 1 * qty;
        }

        if (deductAmount > 0) {
          hasChanges = true;
          const newUsed = invItem.used + deductAmount;
          const newRemain = Math.max(0, invItem.total - newUsed);
          return {
            ...invItem,
            used: newUsed,
            remain: newRemain,
            status: calculateInventoryStatus(newRemain)
          };
        }

        return invItem;
      });
    });

    if (hasChanges) {
      setInventory(updated);
      try {
        await updateInventoryApi(updated);
      } catch (e) {}
    }
  };

  // Hàm phát thông báo âm thanh & giao diện khi có đơn hàng mới (Chuông + Popup + Push)
  const triggerAdminOrderAlert = useCallback((order) => {
    // 1. Cập nhật state đơn mới & popup toast
    setLatestNewOrder(order);
    setUnreadOrdersCount(prev => prev + 1);

    // 2. Phát chuông Web Audio API nếu bật âm thanh
    if (isSoundEnabled) {
      playNewOrderChime();
    }

    // 3. Đẩy Browser Push Notification ra màn hình Desktop/Mobile
    showBrowserOrderNotification(order);
  }, [isSoundEnabled]);

  // 8. Quản lý Mã Giảm Giá & Voucher
  const [discounts, setDiscounts] = useState([
    {
      id: 'dc-1',
      code: 'FLORA10',
      name: 'Giảm 10% Cho Đơn Hoa Nghệ Thuật',
      type: 'percentage',
      value: 10,
      maxDiscount: 100000,
      minOrderValue: 500000,
      usageLimit: 100,
      usedCount: 24,
      isActive: true,
      expiresAt: '2026-12-31'
    },
    {
      id: 'dc-2',
      code: 'VALENTINE50K',
      name: 'Ưu Đãi Yêu Thương 50K',
      type: 'fixed',
      value: 50000,
      maxDiscount: 50000,
      minOrderValue: 400000,
      usageLimit: 50,
      usedCount: 18,
      isActive: true,
      expiresAt: '2026-12-31'
    },
    {
      id: 'dc-3',
      code: 'FREESHIP',
      name: 'Miễn Phí Giao Hoa Tận Tay (35K)',
      type: 'shipping',
      value: 35000,
      maxDiscount: 35000,
      minOrderValue: 300000,
      usageLimit: 200,
      usedCount: 85,
      isActive: true,
      expiresAt: '2026-12-31'
    }
  ]);

  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // 9. Quản lý Đánh Giá & Feedback Khách Hàng Thực Tế
  const [reviews, setReviews] = useState([
    {
      id: 'REV-101',
      customerName: 'Chị Thanh Hằng',
      customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      productName: 'Bó Hoa Juliet Nắng Ban Mai',
      rating: 5,
      occasion: 'Kỷ Niệm Ngày Cưới',
      comment: 'Hoa bên ngoài đẹp hơn cả ảnh mẫu trên web! Shop có gửi ảnh hoa thực tế qua Zalo cho mình duyệt trước khi giao nên cực kỳ an tâm. Shipper giao đúng boong 14h chiều, bạn nhận xúc động suýt khóc. Sẽ ủng hộ Ngọc Flower dài dài!',
      proofImage: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
      verified: true,
      createdAt: '2026-08-25',
      isVisible: true,
      likes: 24
    },
    {
      id: 'REV-102',
      customerName: 'Anh Minh Hoàng',
      customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      productName: 'Lẵng Mẫu Đơn Hoàng Gia Peony Blush',
      rating: 5,
      occasion: 'Sinh Nhật Người Yêu',
      comment: 'Mình chọn tính năng giao hoa ẩn danh giấu tên người gửi. Người yêu nhận được bất ngờ tột cùng. Thiệp in chữ viết tay nắn nót rất nghệ thuật, hoa tươi roi rói thơm ngát cả phòng!',
      proofImage: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
      verified: true,
      createdAt: '2026-08-24',
      isVisible: true,
      likes: 19
    },
    {
      id: 'REV-103',
      customerName: 'Chị Bích Ngọc',
      customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      productName: 'Bình Hoa Tulip Hà Lan Tinh Khôi',
      rating: 5,
      occasion: 'Chúc Mừng Khai Trương',
      comment: 'Form dáng cắm cực kỳ sang trọng và hiện đại, không bị sến như các shop hoa truyền thống. Bình tulip để ở quầy lễ tân công ty đối tác ai cũng khen nức nở.',
      proofImage: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=800&q=80',
      verified: true,
      createdAt: '2026-08-23',
      isVisible: true,
      likes: 15
    }
  ]);

  // Đồng bộ lại toàn bộ dữ liệu từ API Server (Dùng cho Focus, Polling & thủ công)
  const refreshShopData = useCallback(async (isSilent = true) => {
    try {
      const [apiProducts, apiOrders, apiInventory, apiDiscounts, apiReviews, apiSettings] = await Promise.all([
        fetchProductsApi().catch(() => null),
        fetchOrdersApi().catch(() => null),
        fetchInventoryApi().catch(() => null),
        fetchDiscountsApi().catch(() => null),
        fetchReviewsApi().catch(() => null),
        fetchSettingsApi().catch(() => null)
      ]);

      // 1. Đồng bộ Mẫu Hoa với Conflict Resolution & Auto-Rehydration
      if (Array.isArray(apiProducts) && apiProducts.length > 0) {
        const itemsToRehydrate = [];
        updateProductsLocalAndBroadcast(currentProducts => {
          const merged = mergeProductsWithConflictResolution(currentProducts, apiProducts);
          // Tìm các sản phẩm local có timestamp mới hơn server để re-push ngầm ngoài updater
          merged.forEach(mp => {
            const sp = apiProducts.find(p => p.id === mp.id);
            const localTime = mp.updatedAt ? new Date(mp.updatedAt).getTime() : 0;
            const serverTime = sp?.updatedAt ? new Date(sp.updatedAt).getTime() : 0;
            if (localTime > 0 && localTime > serverTime) {
              itemsToRehydrate.push(mp);
            }
          });
          return merged;
        });

        // Re-push ngoài render lifecycle của React
        if (itemsToRehydrate.length > 0) {
          itemsToRehydrate.forEach(mp => {
            updateProductApi(mp.id, mp).catch(() => {});
          });
        }
      }

      // 2. Đồng bộ Đơn Hàng an toàn
      if (Array.isArray(apiOrders) && apiOrders.length > 0) {
        setOrders(currentOrders => {
          const orderMap = new Map();
          (currentOrders || []).forEach(co => orderMap.set(co.id || co.orderCode, co));
          apiOrders.forEach(ao => {
            const key = ao.id || ao.orderCode;
            const co = orderMap.get(key);
            if (!co) {
              orderMap.set(key, ao);
            } else {
              // Bảo vệ trạng thái duyệt ảnh hoặc xác nhận ship cục bộ nếu server chưa kịp nhận
              if (co.isApproved && !ao.isApproved) {
                orderMap.set(key, { ...ao, isApproved: true, status: co.status || ao.status });
              } else if (co.isShippingConfirmed && !ao.isShippingConfirmed) {
                orderMap.set(key, { ...ao, shippingFee: co.shippingFee, totalAmount: co.totalAmount, isShippingConfirmed: true });
              } else {
                orderMap.set(key, { ...co, ...ao });
              }
            }
          });
          return Array.from(orderMap.values());
        });
        setActiveOrder(prev => (prev ? apiOrders.find(o => o.id === prev.id) || prev : apiOrders[0]));
      }

      if (apiInventory?.length > 0) setInventory(apiInventory);
      if (apiDiscounts?.length > 0) setDiscounts(apiDiscounts);
      if (apiReviews?.length > 0) setReviews(apiReviews);

      // 3. Đồng bộ Cài Đặt (Zalo, Telegram, Shipping, Facebook) với so sánh Timestamp
      if (apiSettings) {
        const localSettingsTimestamp = typeof localStorage !== 'undefined' ? localStorage.getItem('flora_settings_updated_at') : null;
        const localSettingsTime = localSettingsTimestamp ? new Date(localSettingsTimestamp).getTime() : 0;
        const serverSettingsTime = apiSettings.updatedAt ? new Date(apiSettings.updatedAt).getTime() : 0;

        if (serverSettingsTime > localSettingsTime) {
          // Server thực sự mới hơn -> Chấp nhận cài đặt mới từ server
          if (apiSettings.shopZaloPhone) {
            setShopZaloPhoneState(apiSettings.shopZaloPhone);
            if (typeof localStorage !== 'undefined') localStorage.setItem('flora_shop_zalo_phone', apiSettings.shopZaloPhone);
          }
          if (apiSettings.shopAddress) {
            setShopAddressState(apiSettings.shopAddress);
            if (typeof localStorage !== 'undefined') localStorage.setItem('flora_shop_address', apiSettings.shopAddress);
          }
          if (apiSettings.telegramBotToken) {
            setTelegramBotTokenState(apiSettings.telegramBotToken);
            if (typeof localStorage !== 'undefined') localStorage.setItem('flora_tg_token', apiSettings.telegramBotToken);
          }
          if (apiSettings.telegramChatId) {
            setTelegramChatIdState(apiSettings.telegramChatId);
            if (typeof localStorage !== 'undefined') localStorage.setItem('flora_tg_chat_id', apiSettings.telegramChatId);
          }
          if (apiSettings.shippingSettings) {
            setShippingSettingsState(prev => ({ ...prev, ...apiSettings.shippingSettings }));
            if (typeof localStorage !== 'undefined') localStorage.setItem('flora_shipping_settings', JSON.stringify(apiSettings.shippingSettings));
          }
          if (apiSettings.facebookSettings) {
            setFacebookSettingsState(prev => ({ ...prev, ...apiSettings.facebookSettings }));
            if (typeof localStorage !== 'undefined') localStorage.setItem('flora_facebook_settings', JSON.stringify(apiSettings.facebookSettings));
          }
          if (typeof localStorage !== 'undefined') localStorage.setItem('flora_settings_updated_at', apiSettings.updatedAt);
        } else if (localSettingsTime > serverSettingsTime) {
          // Local mới hơn server -> GIỮ NGUYÊN LOCAL & Rehydrate container server ngầm!
          const localSettingsPayload = {
            shopZaloPhone: typeof localStorage !== 'undefined' ? localStorage.getItem('flora_shop_zalo_phone') : undefined,
            shopAddress: typeof localStorage !== 'undefined' ? localStorage.getItem('flora_shop_address') : undefined,
            telegramBotToken: typeof localStorage !== 'undefined' ? localStorage.getItem('flora_tg_token') : undefined,
            telegramChatId: typeof localStorage !== 'undefined' ? localStorage.getItem('flora_tg_chat_id') : undefined,
            shippingSettings: shippingSettings,
            facebookSettings: facebookSettings,
            updatedAt: localSettingsTimestamp
          };
          saveSettingsApi(localSettingsPayload).catch(() => {});
        }
      }

      setIsApiConnected(true);
      return true;
    } catch (err) {
      if (!isSilent) console.warn('Lỗi refreshShopData:', err);
      return false;
    }
  }, [updateProductsLocalAndBroadcast, shippingSettings, facebookSettings]);

  // Khởi tạo và lắng nghe Real-time SSE & BroadcastChannel (trì hoãn sau first paint)
  useEffect(() => {
    const initDataFromApi = async () => {
      try {
        const health = await checkHealthApi();
        if (health.status === 'ONLINE') {
          setIsApiConnected(true);
          await refreshShopData(true);
        }
      } catch (err) {
        // Fallback local mode
      }
    };

    const timer = setTimeout(initDataFromApi, 60);

    // ----------------------------------------------------
    // SMART BACKGROUND SYNC & TAB FOCUS LISTENER (HƯỚNG 2)
    // Tự động đồng bộ ngầm khi khách quay lại tab hoặc mỗi 30s
    // ----------------------------------------------------
    let lastSyncTime = Date.now();

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastSyncTime;
        // Chỉ fetch lại nếu đã cách lần fetch gần nhất ít nhất 8 giây (chống spam request)
        if (elapsed > 8000) {
          lastSyncTime = Date.now();
          refreshShopData(true);
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleVisibilityOrFocus);
    }

    // Smart Polling: Tự động làm mới ngầm mỗi 30 giây (khi tab đang mở)
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        lastSyncTime = Date.now();
        refreshShopData(true);
      }
    }, 30000);

    // Kết nối Server-Sent Events (SSE) để nhận sự kiện real-time từ các thiết bị khác
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/admin/events');
      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'NEW_ORDER' && payload.order) {
            setOrders(prev => {
              const exists = prev.some(o => o.id === payload.order.id);
              if (exists) return prev;
              return [payload.order, ...prev];
            });
            triggerAdminOrderAlert(payload.order);
          }
          if (payload.type === 'ORDER_STATUS_CHANGED' && payload.order) {
            setOrders(prev => prev.map(o => (o.id === payload.order.id ? payload.order : o)));
            setActiveOrder(prev => (prev && prev.id === payload.order.id ? payload.order : prev));
          }
          if (payload.type === 'PRODUCT_UPDATED' && payload.product) {
            updateProductsLocalAndBroadcast(prev => {
              const exists = prev.some(p => p.id === payload.product.id);
              if (exists) {
                return prev.map(p => p.id === payload.product.id ? { ...p, ...payload.product } : p);
              }
              return [payload.product, ...prev];
            });
          }
          if (payload.type === 'PRODUCT_ADDED' && payload.product) {
            updateProductsLocalAndBroadcast(prev => {
              const exists = prev.some(p => p.id === payload.product.id);
              if (exists) return prev;
              return [payload.product, ...prev];
            });
          }
          if (payload.type === 'PRODUCT_DELETED' && payload.productId) {
            updateProductsLocalAndBroadcast(prev => prev.filter(p => p.id !== payload.productId));
          }
        } catch (err) {}
      };
    } catch (err) {}

    // Lắng nghe sự kiện đa tab qua BroadcastChannel (Đơn mới, Cập nhật ảnh thật, Đồng bộ mẫu hoa)
    const cleanupTabListener = listenToCrossTabOrders(
      (incomingOrder) => {
        setOrders(prev => {
          const exists = prev.some(o => o.id === incomingOrder.id);
          if (exists) return prev;
          return [incomingOrder, ...prev];
        });
        triggerAdminOrderAlert(incomingOrder);
      },
      (orderId, updates) => {
        setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, ...updates } : o)));
        setActiveOrder(prev => (prev && prev.id === orderId ? { ...prev, ...updates } : prev));
      },
      {
        onProductUpdated: (product) => {
          updateProductsLocalAndBroadcast(prev => {
            const exists = prev.some(p => p.id === product.id);
            if (exists) {
              return prev.map(p => p.id === product.id ? { ...p, ...product } : p);
            }
            return [product, ...prev];
          });
        },
        onProductAdded: (product) => {
          updateProductsLocalAndBroadcast(prev => {
            const exists = prev.some(p => p.id === product.id);
            if (exists) return prev;
            return [product, ...prev];
          });
        },
        onProductDeleted: (productId) => {
          updateProductsLocalAndBroadcast(prev => prev.filter(p => p.id !== productId));
        }
      }
    );

    return () => {
      clearTimeout(timer);
      if (eventSource) eventSource.close();
      cleanupTabListener();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleVisibilityOrFocus);
      }
      clearInterval(pollInterval);
    };
  }, [triggerAdminOrderAlert, updateProductsLocalAndBroadcast, refreshShopData]);


  // CRUD SẢN PHẨM MẪU HOA
  const addProduct = async (newProduct) => {
    const now = new Date().toISOString();
    const id = newProduct.id || `fl-${Date.now()}`;
    const productWithTimestamp = {
      ...newProduct,
      id,
      rating: newProduct.rating || 5.0,
      reviewsCount: newProduct.reviewsCount || 0,
      isAvailable: newProduct.isAvailable !== undefined ? newProduct.isAvailable : true,
      updatedAt: now
    };
    unmarkProductDeletedLocal(id);

    let finalProduct = null;
    try {
      finalProduct = await createProductApi(productWithTimestamp);
    } catch (e) {
      console.warn('Lỗi API createProduct, fallback local:', e);
      finalProduct = productWithTimestamp;
    }
    if (finalProduct) {
      const mergedProduct = { ...productWithTimestamp, ...finalProduct, updatedAt: now };
      updateProductsLocalAndBroadcast(
        prev => [mergedProduct, ...prev.filter(p => p.id !== mergedProduct.id)],
        () => broadcastProductAddToTabs(mergedProduct)
      );
      return mergedProduct;
    }
    return finalProduct;
  };

  const updateProduct = async (productId, updatedFields) => {
    const now = new Date().toISOString();
    const payload = { ...updatedFields, id: productId, updatedAt: now };
    unmarkProductDeletedLocal(productId);

    let finalProduct = null;
    try {
      finalProduct = await updateProductApi(productId, payload);
    } catch (e) {
      console.warn('Lỗi API updateProduct, fallback local:', e);
      const current = products.find(p => p.id === productId) || {};
      finalProduct = { ...current, ...payload };
    }
    if (finalProduct) {
      const mergedProduct = { ...payload, ...finalProduct, updatedAt: now };
      updateProductsLocalAndBroadcast(
        prev => prev.map(p => p.id === productId ? { ...p, ...mergedProduct } : p),
        () => broadcastProductUpdateToTabs(mergedProduct)
      );
      return mergedProduct;
    }
    return finalProduct;
  };

  const deleteProduct = async (productId) => {
    markProductDeletedLocal(productId);
    try {
      await deleteProductApi(productId);
    } catch (e) {
      console.warn('Lỗi API deleteProduct, fallback local:', e);
    }
    updateProductsLocalAndBroadcast(
      prev => prev.filter(p => p.id !== productId),
      () => broadcastProductDeleteToTabs(productId)
    );
  };

  const toggleProductAvailability = async (productId) => {
    const now = new Date().toISOString();
    let finalProduct = null;
    try {
      finalProduct = await toggleProductApi(productId);
    } catch (e) {
      console.warn('Lỗi API toggleProduct, fallback local:', e);
      const current = products.find(p => p.id === productId);
      if (current) {
        finalProduct = { ...current, isAvailable: current.isAvailable === false ? true : false, updatedAt: now };
      }
    }
    if (finalProduct) {
      const mergedProduct = { ...finalProduct, updatedAt: now };
      updateProductsLocalAndBroadcast(
        prev => prev.map(p => p.id === productId ? { ...p, ...mergedProduct } : p),
        () => broadcastProductUpdateToTabs(mergedProduct)
      );
      return mergedProduct;
    } else {
      updateProductsLocalAndBroadcast(
        prev => prev.map(p => p.id === productId ? { ...p, isAvailable: p.isAvailable === false ? true : false, updatedAt: now } : p)
      );
    }
  };


  // GIỎ HÀNG
  const addToCart = (product, customOptions = {}) => {
    const size = customOptions.size || { id: 'standard', name: 'Tiêu Chuẩn', priceMultiplier: 1.0 };
    const wrapper = customOptions.wrapper || { id: 'sage', name: 'Giấy Giản Dị Xanh Sage' };
    const cardMessage = customOptions.cardMessage || 'Gửi gắm yêu thương!';
    const senderSign = customOptions.senderSign || 'Người gửi';
    const addOns = customOptions.addOns || [];
    
    const unitPrice = Math.round(product.price * size.priceMultiplier);
    
    const newItem = {
      cartItemId: `${product.id}-${Date.now()}`,
      id: product.id,
      name: product.name,
      image: product.image,
      price: unitPrice,
      size,
      wrapper,
      cardMessage,
      senderSign,
      addOns,
      quantity: 1,
    };

    setCart(prev => [newItem, ...prev]);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => (item.cartItemId || item.id) !== cartItemId));
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart(prev => prev.map(item => {
      if ((item.cartItemId || item.id) === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const cartTotal = cart.reduce((total, item) => {
    const addOnsTotal = (item.addOns || []).reduce((sum, a) => sum + a.price, 0);
    return total + ((item.price + addOnsTotal) * item.quantity);
  }, 0);

  // Tính số tiền giảm giá thực tế dựa trên giỏ hàng hiện tại
  const discountAmount = React.useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      const calculated = Math.round((cartTotal * appliedCoupon.value) / 100);
      return appliedCoupon.maxDiscount ? Math.min(calculated, appliedCoupon.maxDiscount) : calculated;
    }
    if (appliedCoupon.type === 'fixed') {
      return Math.min(appliedCoupon.value, cartTotal);
    }
    if (appliedCoupon.type === 'shipping') {
      return 35000;
    }
    return appliedCoupon.discountAmount || 0;
  }, [appliedCoupon, cartTotal]);

  const applyCoupon = async (code) => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) throw new Error('Vui lòng nhập mã giảm giá.');

    try {
      const res = await validateDiscountApi(cleanCode, cartTotal);
      if (res.success && res.discount) {
        setAppliedCoupon(res.discount);
        return res;
      }
      throw new Error(res.message || 'Mã giảm giá không hợp lệ');
    } catch (err) {
      // Fallback local validation
      const localMatch = discounts.find(d => d.code === cleanCode && d.isActive);
      if (!localMatch) throw new Error(err.message || 'Mã giảm giá không tồn tại hoặc đã hết hạn.');
      if (cartTotal < (localMatch.minOrderValue || 0)) {
        throw new Error(`Đơn hàng cần tối thiểu ${Number(localMatch.minOrderValue).toLocaleString('vi-VN')}đ để dùng mã này.`);
      }
      setAppliedCoupon(localMatch);
      return { success: true, discount: localMatch, message: 'Áp dụng mã thành công!' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const addDiscount = async (discountData) => {
    try {
      const saved = await createDiscountApi(discountData);
      setDiscounts(prev => [saved, ...prev]);
    } catch (e) {
      const newD = { ...discountData, id: `dc-${Date.now()}`, usedCount: 0, isActive: true };
      setDiscounts(prev => [newD, ...prev]);
    }
  };

  const toggleDiscount = async (discountId) => {
    try {
      const saved = await toggleDiscountApi(discountId);
      setDiscounts(prev => prev.map(d => d.id === discountId ? saved : d));
    } catch (e) {
      setDiscounts(prev => prev.map(d => d.id === discountId ? { ...d, isActive: !d.isActive } : d));
    }
  };

  const deleteDiscount = async (discountId) => {
    try {
      await deleteDiscountApi(discountId);
    } catch (e) {}
    setDiscounts(prev => prev.filter(d => d.id !== discountId));
  };

  // CRUD ĐÁNH GIÁ FEEDBACK KHÁCH HÀNG
  const addReview = async (reviewData) => {
    try {
      const saved = await createReviewApi(reviewData);
      setReviews(prev => [saved, ...prev]);
      return saved;
    } catch (e) {
      const fallbackRev = {
        ...reviewData,
        id: `REV-${Date.now()}`,
        verified: true,
        createdAt: new Date().toISOString().split('T')[0],
        isVisible: true,
        likes: 1
      };
      setReviews(prev => [fallbackRev, ...prev]);
      return fallbackRev;
    }
  };

  const toggleReview = async (reviewId) => {
    try {
      const saved = await toggleReviewApi(reviewId);
      setReviews(prev => prev.map(r => r.id === reviewId ? saved : r));
    } catch (e) {
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isVisible: !r.isVisible } : r));
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await deleteReviewApi(reviewId);
    } catch (e) {}
    setReviews(prev => prev.filter(r => r.id !== reviewId));
  };

  // Khách tạo đơn hàng mới -> Lưu API & Kích hoạt thông báo đa kênh
  const submitOrder = async (orderData) => {
    const token = telegramBotToken || localStorage.getItem('flora_tg_token');
    const chatId = telegramChatId || localStorage.getItem('flora_tg_chat_id');

    // Tạo danh sách items chi tiết bao gồm size, wrapper, add-ons
    const formattedItems = cart.map(i => {
      const sizeText = i.size?.name ? ` [Size: ${i.size.name}]` : '';
      const wrapperText = i.wrapper?.name ? ` [Gói: ${i.wrapper.name}]` : '';
      const addOnsText = (i.addOns && i.addOns.length > 0) 
        ? ` + Quà: ${i.addOns.map(a => a.name).join(', ')}` 
        : '';
      const itemUnitPrice = i.price + (i.addOns || []).reduce((sum, a) => sum + a.price, 0);
      const itemTotalPrice = itemUnitPrice * (i.quantity || 1);

      return {
        name: `${i.name}${sizeText}${wrapperText}${addOnsText} ×${i.quantity || 1}`,
        price: itemTotalPrice
      };
    });

    const mainProductName = cart.length === 1
      ? `${cart[0].name} (${cart[0].size?.name || 'Tiêu chuẩn'})`
      : `${cart[0]?.name || 'Bó hoa tươi'} và ${cart.length - 1} món khác`;

    const mainCardMessage = orderData.cardMessage || cart[0]?.cardMessage || 'Gửi gắm yêu thương!';
    const mainSenderSign = orderData.senderSign || cart[0]?.senderSign || orderData.senderName || 'Người gửi';
    const effectiveShippingFee = orderData.shippingFee !== undefined 
      ? Number(orderData.shippingFee) 
      : getShippingFee(orderData.deliveryType || 'timeslot', cartTotal);
    const finalTotalAmount = Math.max(0, cartTotal + effectiveShippingFee - discountAmount);

    const orderPayload = {
      customerName: orderData.senderName || 'Khách hàng',
      customerPhone: orderData.senderPhone || '0901 234 567',
      receiverName: orderData.receiverName || 'Người nhận hoa',
      receiverPhone: orderData.receiverPhone || '0988 765 432',
      receiverAddress: orderData.receiverAddress || 'TP. Buôn Ma Thuột, Đắk Lắk',
      isAnonymous: Boolean(orderData.isAnonymous),
      productName: mainProductName,
      cardMessage: mainCardMessage,
      senderSign: mainSenderSign,
      deliverySlot: orderData.deliverySlot || 'Hỏa tốc 90 phút',
      shippingFee: effectiveShippingFee,
      totalAmount: finalTotalAmount,
      discountCode: appliedCoupon?.code || null,
      discountAmount: discountAmount,
      proofPhotoUrl: null,
      catalogSamplePhoto: cart[0]?.image || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
      items: formattedItems,
      telegramBotToken: token,
      telegramChatId: chatId
    };

    let newOrder = null;
    let serverSentTelegram = false;
    try {
      const res = await createOrderApi(orderPayload);
      newOrder = res?.data || res;
      serverSentTelegram = Boolean(res?.telegramSent);
    } catch (e) {
      const newOrderCode = `FB-${Math.floor(10000 + Math.random() * 90000)}`;
      newOrder = {
        ...orderPayload,
        id: newOrderCode,
        orderCode: newOrderCode,
        status: 'ARRANGING',
        florist: 'Thợ cắm hoa Minh Thư',
        floristAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        createdAt: `${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} (${new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})`,
        isApproved: false
      };
    }

    // Cơ chế Hybrid: Nếu Server Node.js không gửi được (DNS/Proxy/Offline), Trình duyệt Client tự động gửi trực tiếp
    if (!serverSentTelegram && token && chatId) {
      sendTelegramOrderNotificationApi(token, chatId, newOrder).catch((err) => {
        console.warn('Client Telegram notification attempt:', err.message);
      });
    }

    setOrders(prev => {
      const exists = prev.some(o => o.id === newOrder.id || o.orderCode === newOrder.orderCode);
      if (exists) return prev;
      return [newOrder, ...prev];
    });
    setActiveOrder(newOrder);

    // Tự động trừ hoa nguyên liệu tương ứng trong kho
    deductInventoryOnOrder(cart);

    setCart([]);
    setIsCheckoutOpen(false);
    setIsTrackingOpen(true);

    // Phát sự kiện đa tab & kích hoạt âm thanh chuông báo
    broadcastNewOrderToTabs(newOrder);
    triggerAdminOrderAlert(newOrder);

    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1B3B2B', '#E8998D', '#F5D6CE', '#5C8A70']
      });
    }).catch(() => {});
  };

  const approvePhotoProof = async () => {
    if (!activeOrder) return;
    try {
      await updateOrderStatusApi(activeOrder.id, { isApproved: true, status: 'DELIVERING' });
    } catch (e) {}

    setOrders(prev => prev.map(o => {
      if (o.id === activeOrder.id) {
        return { ...o, isApproved: true, status: 'DELIVERING' };
      }
      return o;
    }));

    setActiveOrder(prev => ({
      ...prev,
      isApproved: true,
      status: 'DELIVERING'
    }));

    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#5C8A70', '#E8998D']
      });
    }).catch(() => {});
  };

  const updateOrderByAdmin = async (orderId, updates) => {
    try {
      await updateOrderStatusApi(orderId, updates);
    } catch (e) {}

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedOrder = { ...o, ...updates };
        if (activeOrder && activeOrder.id === orderId) {
          setActiveOrder(updatedOrder);
        }
        return updatedOrder;
      }
      return o;
    }));

    // Phát sự kiện cập nhật đơn hàng sang các tab khác realtime
    broadcastOrderUpdateToTabs(orderId, updates);
  };

  // Cập nhật phí ship riêng cho từng đơn hàng từ Admin Dashboard
  const updateOrderShippingFee = async (orderId, newShippingFee) => {
    const fee = Math.max(0, Number(newShippingFee) || 0);
    const targetOrder = orders.find(o => o.id === orderId || o.orderCode === orderId);
    if (!targetOrder) return;

    // Tính lại totalAmount chuẩn xác
    const itemsTotal = Array.isArray(targetOrder.items) && targetOrder.items.length > 0
      ? targetOrder.items.reduce((sum, it) => sum + Number(it.price || 0), 0)
      : Number(targetOrder.productPrice || targetOrder.totalAmount || 0);

    const discount = Number(targetOrder.discountAmount || 0);
    const newTotalAmount = Math.max(0, itemsTotal - discount + fee);

    const updates = {
      shippingFee: fee,
      totalAmount: newTotalAmount,
      isShippingConfirmed: true,
      shippingConfirmedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    try {
      await updateOrderStatusApi(targetOrder.id, updates);
    } catch (e) {}

    setOrders(prev => prev.map(o => (o.id === targetOrder.id ? { ...o, ...updates } : o)));
    if (activeOrder && (activeOrder.id === targetOrder.id || activeOrder.orderCode === targetOrder.id)) {
      setActiveOrder(prev => ({ ...prev, ...updates }));
    }

    broadcastOrderUpdateToTabs(targetOrder.id, updates);
    return updates;
  };

  const resetUnreadOrdersCount = () => {
    setUnreadOrdersCount(0);
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        shopZaloPhone,
        setShopZaloPhone,
        shopAddress,
        setShopAddress,
        zaloModeType,
        setZaloModeType,
        telegramBotToken,
        setTelegramBotToken,
        telegramChatId,
        setTelegramChatId,
        isSoundEnabled,
        setIsSoundEnabled,
        shippingSettings,
        updateShippingSettings,
        facebookSettings,
        updateFacebookSettings,
        getShippingFee,
        updateOrderShippingFee,
        unreadOrdersCount,
        resetUnreadOrdersCount,
        latestNewOrder,
        setLatestNewOrder,
        triggerAdminOrderAlert,
        refreshShopData,
        isApiConnected,
        cart,
        wishlist,
        activeCategory,
        setActiveCategory,
        selectedOccasion,
        setSelectedOccasion,
        selectedColor,
        setSelectedColor,
        selectedWeddingType,
        setSelectedWeddingType,
        selectedFruitType,
        setSelectedFruitType,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isAIFloristOpen,
        setIsAIFloristOpen,
        isTrackingOpen,
        setIsTrackingOpen,
        isZaloMode,
        setIsZaloMode,
        quickViewProduct,
        setQuickViewProduct,
        orders,
        activeOrder,
        inventory,
        addInventoryItem,
        updateInventoryItem,
        restockInventoryItem,
        deleteInventoryItem,
        discounts,
        appliedCoupon,
        discountAmount,
        applyCoupon,
        removeCoupon,
        addDiscount,
        toggleDiscount,
        deleteDiscount,
        reviews,
        addReview,
        toggleReview,
        deleteReview,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleWishlist,
        cartTotal,
        submitOrder,
        approvePhotoProof,
        updateOrderByAdmin
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
