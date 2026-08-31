import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
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
    receiverAddress: 'Phòng 402, Bitexco, 2 Hải Triều, Q.1, TP.HCM',
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

export const ShopProvider = ({ children }) => {
  // 1. Quản lý danh mục mẫu hoa
  const [products, setProducts] = useState(FLOWERS_DATA);
  const [isApiConnected, setIsApiConnected] = useState(false);

  // 2. Cài đặt kết nối Zalo Cá Nhân / Telegram (Lưu bền vững vào LocalStorage & Backend Settings)
  const [shopZaloPhone, setShopZaloPhoneState] = useState(() => {
    return localStorage.getItem('flora_shop_zalo_phone') || '0843066604';
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
    setShopZaloPhoneState(clean);
    localStorage.setItem('flora_shop_zalo_phone', clean);
    saveSettingsApi({ shopZaloPhone: clean }).catch(() => {});
  };

  const setTelegramBotToken = (val) => {
    setTelegramBotTokenState(val);
    localStorage.setItem('flora_tg_token', val);
    saveSettingsApi({ telegramBotToken: val }).catch(() => {});
  };

  const setTelegramChatId = (val) => {
    setTelegramChatIdState(val);
    localStorage.setItem('flora_tg_chat_id', val);
    saveSettingsApi({ telegramChatId: val }).catch(() => {});
  };

  // 3. Quản lý thông báo Admin Real-time
  const [isSoundEnabled, setIsSoundEnabledState] = useState(() => {
    return localStorage.getItem('flora_sound_enabled') !== 'false';
  });

  const setIsSoundEnabled = (val) => {
    setIsSoundEnabledState(val);
    localStorage.setItem('flora_sound_enabled', String(val));
    saveSettingsApi({ isSoundEnabled: val }).catch(() => {});
  };

  // 3.1. Cấu hình Phí Giao Hoa & Freeship
  const [shippingSettings, setShippingSettingsState] = useState(() => {
    try {
      const cached = localStorage.getItem('flora_shipping_settings');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      standardFee: 35000,
      expressFee: 60000,
      freeShippingThreshold: 1000000,
      isFreeShippingEnabled: true,
      freeShippingNote: 'Miễn phí giao hoa tiêu chuẩn cho đơn hàng từ 1.000.000đ'
    };
  });

  const updateShippingSettings = (newSettings) => {
    setShippingSettingsState(prev => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem('flora_shipping_settings', JSON.stringify(merged));
      } catch (e) {}
      saveSettingsApi({ shippingSettings: merged }).catch(() => {});
      return merged;
    });
  };

  const getShippingFee = useCallback((type = 'timeslot', subtotal = 0) => {
    const { standardFee = 35000, expressFee = 60000, freeShippingThreshold = 1000000, isFreeShippingEnabled = true } = shippingSettings;
    const isFreeship = isFreeShippingEnabled && subtotal >= freeShippingThreshold;

    if (type === 'express') {
      if (isFreeship) {
        return Math.max(0, Number(expressFee) - Number(standardFee));
      }
      return Number(expressFee);
    }

    if (isFreeship) return 0;
    return Number(standardFee);
  }, [shippingSettings]);

  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [latestNewOrder, setLatestNewOrder] = useState(null);

  // 4. Giỏ hàng & Sản phẩm
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
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
      comment: 'Hoa bên ngoài đẹp hơn cả ảnh mẫu trên web! Shop có gửi ảnh hoa thực tế qua Zalo cho mình duyệt trước khi giao nên cực kỳ an tâm. Shipper giao đúng boong 14h chiều, bạn nhận xúc động suýt khóc. Sẽ ủng hộ Flora & Bloom dài dài!',
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

  // Khởi tạo và lắng nghe Real-time SSE & BroadcastChannel
  useEffect(() => {
    const initDataFromApi = async () => {
      try {
        const health = await checkHealthApi();
        if (health.status === 'ONLINE') {
          setIsApiConnected(true);
          const [apiProducts, apiOrders, apiInventory, apiDiscounts, apiReviews, apiSettings] = await Promise.all([
            fetchProductsApi(),
            fetchOrdersApi(),
            fetchInventoryApi(),
            fetchDiscountsApi().catch(() => null),
            fetchReviewsApi().catch(() => null),
            fetchSettingsApi().catch(() => null)
          ]);
          if (apiProducts?.length > 0) setProducts(apiProducts);
          if (apiOrders?.length > 0) {
            setOrders(apiOrders);
            setActiveOrder(apiOrders[0]);
          }
          if (apiInventory?.length > 0) setInventory(apiInventory);
          if (apiDiscounts?.length > 0) setDiscounts(apiDiscounts);
          if (apiReviews?.length > 0) setReviews(apiReviews);
          if (apiSettings) {
            if (apiSettings.shopZaloPhone) setShopZaloPhoneState(apiSettings.shopZaloPhone);
            if (apiSettings.telegramBotToken) setTelegramBotTokenState(apiSettings.telegramBotToken);
            if (apiSettings.telegramChatId) setTelegramChatIdState(apiSettings.telegramChatId);
            if (apiSettings.shippingSettings) setShippingSettingsState(prev => ({ ...prev, ...apiSettings.shippingSettings }));
          }
        }
      } catch (err) {
        console.log('API Server running in local fallback state mode');
      }
    };

    initDataFromApi();

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
        } catch (err) {}
      };
    } catch (err) {}

    // Lắng nghe sự kiện đa tab qua BroadcastChannel (Đơn mới & Cập nhật ảnh thật)
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
      }
    );

    return () => {
      if (eventSource) eventSource.close();
      cleanupTabListener();
    };
  }, [triggerAdminOrderAlert]);

  // CRUD SẢN PHẨM MẪU HOA
  const addProduct = async (newProduct) => {
    try {
      const saved = await createProductApi(newProduct);
      setProducts(prev => [saved, ...prev]);
    } catch (e) {
      const id = `fl-${Date.now()}`;
      const productToAdd = { ...newProduct, id, rating: 5.0, reviewsCount: 0, isAvailable: true };
      setProducts(prev => [productToAdd, ...prev]);
    }
  };

  const updateProduct = async (productId, updatedFields) => {
    try {
      const saved = await updateProductApi(productId, updatedFields);
      setProducts(prev => prev.map(p => p.id === productId ? saved : p));
    } catch (e) {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updatedFields } : p));
    }
  };

  const deleteProduct = async (productId) => {
    try {
      await deleteProductApi(productId);
    } catch (e) {}
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const toggleProductAvailability = async (productId) => {
    try {
      const saved = await toggleProductApi(productId);
      setProducts(prev => prev.map(p => p.id === productId ? saved : p));
    } catch (e) {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p));
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
      receiverAddress: orderData.receiverAddress || 'Quận 1, TP.HCM',
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
    setCart([]);
    setIsCheckoutOpen(false);
    setIsTrackingOpen(true);

    // Phát sự kiện đa tab & kích hoạt âm thanh chuông báo
    broadcastNewOrderToTabs(newOrder);
    triggerAdminOrderAlert(newOrder);

    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1B3B2B', '#E8998D', '#F5D6CE', '#5C8A70']
    });
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

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#5C8A70', '#E8998D']
    });
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
        getShippingFee,
        unreadOrdersCount,
        resetUnreadOrdersCount,
        latestNewOrder,
        setLatestNewOrder,
        triggerAdminOrderAlert,
        isApiConnected,
        cart,
        wishlist,
        selectedOccasion,
        setSelectedOccasion,
        selectedColor,
        setSelectedColor,
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
