import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { OCCASIONS, COLOR_TONES } from '../data/flowers';
import { 
  openPersonalZaloChat, 
  openPersonalZaloToCustomer 
} from '../services/zaloService';
import { playTestChime } from '../services/soundService';
import { 
  requestBrowserNotificationPermission, 
  getBrowserNotificationPermission 
} from '../services/notificationService';
import { sendTelegramTestApi, getTelegramChatIdAutoApi } from '../api';
import { PrintInvoiceModal } from './PrintInvoiceModal';
import { 
  ShoppingBag, 
  Flower2, 
  Camera, 
  CheckCircle2, 
  Phone, 
  ArrowLeft, 
  Sparkles, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Tag, 
  Smartphone,
  Send,
  QrCode,
  ShieldCheck,
  UserCheck,
  Zap,
  Copy,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  ExternalLink,
  MessageSquareShare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCheck,
  LogOut,
  Printer
} from 'lucide-react';

export const AdminDashboard = ({ onBackToStore, adminUser, onLogout }) => {
  const { 
    orders, 
    updateOrderByAdmin, 
    inventory, 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProductAvailability,
    shopZaloPhone,
    setShopZaloPhone,
    telegramBotToken,
    setTelegramBotToken,
    telegramChatId,
    setTelegramChatId,
    isSoundEnabled,
    setIsSoundEnabled,
    unreadOrdersCount,
    resetUnreadOrdersCount,
    latestNewOrder,
    setLatestNewOrder
  } = useShop();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products_cms' | 'zalo_config' | 'inventory'
  const [selectedOrderFilter, setSelectedOrderFilter] = useState('all');
  const [browserNotifStatus, setBrowserNotifStatus] = useState(getBrowserNotificationPermission());
  const [printOrder, setPrintOrder] = useState(null);
  
  // State Modal Thêm/Sửa Mẫu Hoa Mới
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    price: 750000,
    originalPrice: 850000,
    occasion: 'love',
    colorTone: 'pastel',
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
    tags: ['Mẫu Mới'],
    meaning: 'Gửi gắm tình cảm chân thành và sự ngọt ngào.',
    flowerTypes: 'Hồng Juliet, Baby Hà Lan, Lá Bạc',
    freshDays: 4,
  });

  // State Cài đặt
  const [inputShopPhone, setInputShopPhone] = useState(shopZaloPhone);
  const [inputBotToken, setInputBotToken] = useState(telegramBotToken);
  const [inputChatId, setInputChatId] = useState(telegramChatId);
  const [saveZaloSuccess, setSaveZaloSuccess] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState(null);
  const [isDetectingChatId, setIsDetectingChatId] = useState(false);
  const [autoDetectMsg, setAutoDetectMsg] = useState(null);
  const [copyToast, setCopyToast] = useState('');
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [showTelegramGuide, setShowTelegramGuide] = useState(true);

  // Đồng bộ giá trị từ localStorage/Context vào Form
  useEffect(() => {
    if (telegramBotToken) setInputBotToken(telegramBotToken);
  }, [telegramBotToken]);

  useEffect(() => {
    if (telegramChatId) setInputChatId(telegramChatId);
  }, [telegramChatId]);

  useEffect(() => {
    if (shopZaloPhone) setInputShopPhone(shopZaloPhone);
  }, [shopZaloPhone]);

  // Cập nhật trạng thái quyền thông báo trình duyệt
  const handleRequestBrowserNotif = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserNotifStatus(res);
  };

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setFormData({
      name: '',
      subtitle: '',
      price: 750000,
      originalPrice: 850000,
      occasion: 'love',
      colorTone: 'pastel',
      image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
      tags: ['Mẫu Mới'],
      meaning: 'Gửi gắm tình cảm chân thành và sự ngọt ngào.',
      flowerTypes: 'Hồng Juliet, Baby Hà Lan, Lá Bạc',
      freshDays: 4,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProductId(prod.id);
    setFormData({
      name: prod.name,
      subtitle: prod.subtitle || '',
      price: prod.price,
      originalPrice: prod.originalPrice || prod.price,
      occasion: prod.occasion || 'love',
      colorTone: prod.colorTone || 'pastel',
      image: prod.image,
      tags: prod.tags || ['Mẫu Mới'],
      meaning: prod.meaning || '',
      flowerTypes: Array.isArray(prod.flowerTypes) ? prod.flowerTypes.join(', ') : prod.flowerTypes || '',
      freshDays: prod.freshDays || 4,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    const flowerTypesArray = formData.flowerTypes.split(',').map(s => s.trim()).filter(Boolean);

    if (editingProductId) {
      updateProduct(editingProductId, {
        ...formData,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice),
        flowerTypes: flowerTypesArray,
      });
    } else {
      addProduct({
        ...formData,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice),
        flowerTypes: flowerTypesArray,
      });
    }
    setIsProductModalOpen(false);
  };

  const handleSaveZaloSettings = (e) => {
    e.preventDefault();
    const cleanToken = (inputBotToken || '').trim();
    const cleanChatId = (inputChatId || '').trim();
    const cleanPhone = (inputShopPhone || '').trim();

    setShopZaloPhone(cleanPhone);
    setTelegramBotToken(cleanToken);
    setTelegramChatId(cleanChatId);
    setSaveZaloSuccess(true);
    setTimeout(() => setSaveZaloSuccess(false), 3000);
  };

  // Tự động tìm Chat ID từ Bot Token
  const handleAutoDetectChatId = async () => {
    if (!inputBotToken) {
      setAutoDetectMsg({ success: false, text: 'Vui lòng dán chuỗi Bot Token vào ô trên trước khi dò tìm!' });
      return;
    }
    setIsDetectingChatId(true);
    setAutoDetectMsg(null);
    try {
      const res = await getTelegramChatIdAutoApi(inputBotToken);
      setIsDetectingChatId(false);
      if (res.chatId) {
        setInputChatId(res.chatId);
        setAutoDetectMsg({ 
          success: true, 
          text: `🎉 Tuyệt vời! Đã tìm thấy Chat ID của ${res.senderName || 'bạn'}: ${res.chatId} (Đã tự động điền vào ô)` 
        });
      }
    } catch (err) {
      setIsDetectingChatId(false);
      setAutoDetectMsg({ success: false, text: err.message });
    }
  };

  const handleTestTelegram = async () => {
    setTelegramStatus({ loading: true, message: 'Đang gửi tin nhắn test qua Telegram...' });
    try {
      const res = await sendTelegramTestApi(inputBotToken, inputChatId);
      setTelegramStatus({ success: true, message: res.message });
    } catch (err) {
      setTelegramStatus({ success: false, message: err.message });
    }
  };

  const handleOpenPersonalZaloForOrder = (order) => {
    const msg = openPersonalZaloToCustomer(
      order.customerPhone, 
      order.orderCode || order.id, 
      order.proofPhotoUrl || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
      order.customerName
    );
    setCopyToast(`Đã copy nội dung gửi duyệt ảnh cho ${order.customerName}! Hãy bấm Dán (Paste) vào Zalo.`);
    setTimeout(() => setCopyToast(''), 4000);
  };

  const handleUploadProofPhoto = (orderId) => {
    const sampleProof = 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80';
    updateOrderByAdmin(orderId, {
      proofPhotoUrl: sampleProof,
      status: 'PHOTO_READY'
    });
  };

  const handleSendToShipper = (orderId) => {
    updateOrderByAdmin(orderId, {
      status: 'DELIVERING',
      isApproved: true
    });
  };

  const filteredOrders = orders.filter(o => {
    if (selectedOrderFilter === 'all') return true;
    return o.status === selectedOrderFilter;
  });

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-[#222523] font-sans">
      
      {/* Toast thông báo copy tin nhắn */}
      {copyToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#1B3B2B] text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* POPUP BANNER THÔNG BÁO ĐƠN HÀNG MỚI NỔI (REALTIME ALERT) */}
      {latestNewOrder && (
        <div className="fixed top-20 right-6 z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border-2 border-[#E8998D] overflow-hidden animate-bounce-short text-[#222523]">
          <div className="bg-gradient-to-r from-[#1B3B2B] to-[#264A37] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8998D] animate-ping" />
              <span className="font-bold text-xs">🔔 CÓ ĐƠN ĐẶT HOA MỚI!</span>
            </div>
            <button
              onClick={() => setLatestNewOrder(null)}
              className="text-white/70 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <strong className="block text-[#1B3B2B] text-sm font-serif">{latestNewOrder.productName}</strong>
                <span className="text-gray-500 block">Người đặt: <strong>{latestNewOrder.customerName}</strong></span>
              </div>
              <span className="font-bold text-[#C4685A] text-sm">
                {Number(latestNewOrder.totalAmount || 0).toLocaleString('vi-VN')}đ
              </span>
            </div>

            <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-gray-200 text-[11px] text-gray-600">
              <p>⏱️ Khung giờ hẹn: <strong>{latestNewOrder.deliverySlot}</strong></p>
              <p>📍 Giao tới: {latestNewOrder.receiverAddress}</p>
            </div>

            <div className="pt-1 flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setLatestNewOrder(null);
                  resetUnreadOrdersCount();
                }}
                className="flex-1 bg-[#1B3B2B] hover:bg-[#264A37] text-white font-bold py-2 rounded-xl text-center text-xs transition-all active:scale-95"
              >
                Xem & Cắm Hoa Ngay
              </button>
              <button
                onClick={() => setLatestNewOrder(null)}
                className="px-3 py-2 border border-gray-300 text-gray-600 hover:bg-gray-100 rounded-xl text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Top Header */}
      <header className="bg-[#1B3B2B] text-white border-b border-[#264A37] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onBackToStore}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-xs font-semibold px-3 py-2 rounded-full transition-all text-emerald-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">← Về Cửa Hàng</span>
            </button>

            <div className="flex items-center gap-2 border-l border-white/20 pl-3 sm:pl-4">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight">
                Flora & Bloom
              </span>
              <span className="text-[10px] bg-[#E8998D] text-[#1B3B2B] font-extrabold px-2 py-0.5 rounded-md uppercase">
                Admin
              </span>
            </div>
          </div>

          {/* Quick Notification & Sound Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Nút Bật/Tắt Chuông Báo */}
            <button
              onClick={() => {
                setIsSoundEnabled(!isSoundEnabled);
                if (!isSoundEnabled) playTestChime();
              }}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full transition-all border ${
                isSoundEnabled 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30' 
                  : 'bg-red-500/20 text-red-300 border-red-400/40 hover:bg-red-500/30'
              }`}
              title={isSoundEnabled ? 'Chuông báo đơn mới đang BẬT (Click để tắt)' : 'Chuông báo đơn mới đang TẮT (Click để bật)'}
            >
              {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden md:inline text-[11px] font-semibold">{isSoundEnabled ? 'Chuông Bật' : 'Tắt Chuông'}</span>
            </button>

            {/* Nút Nghe Thử Chuông */}
            <button
              onClick={playTestChime}
              className="text-[11px] bg-white/10 hover:bg-white/20 text-emerald-200 px-2.5 py-1.5 rounded-full transition-all hidden sm:inline"
              title="Phát thử âm thanh chuông báo Botanical Crystal Chime"
            >
              🎵 Thử Chuông
            </button>

            {/* Chuông Thông Báo Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifDropdownOpen(!isNotifDropdownOpen);
                  if (!isNotifDropdownOpen) resetUnreadOrdersCount();
                }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all relative text-white"
                title="Thông báo đơn mới"
              >
                <Bell className="w-4 h-4" />
                {unreadOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#E8998D] text-[#1B3B2B] text-[10px] font-extrabold flex items-center justify-center animate-pulse border-2 border-[#1B3B2B]">
                    {unreadOrdersCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {isNotifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 text-[#222523] text-xs space-y-3 z-50 animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <strong className="font-serif text-sm text-[#1B3B2B]">Thông Báo Đơn Hàng</strong>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5 animate-pulse" /> SSE Realtime
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {orders.slice(0, 4).map((o) => (
                      <div
                        key={o.id}
                        onClick={() => {
                          setActiveTab('orders');
                          setIsNotifDropdownOpen(false);
                        }}
                        className="p-2.5 rounded-xl bg-gray-50 hover:bg-[#FAF8F5] cursor-pointer transition-colors border border-gray-100"
                      >
                        <div className="flex justify-between font-bold text-[#1B3B2B]">
                          <span>#{o.orderCode || o.id}</span>
                          <span className="text-[#C4685A]">{Number(o.totalAmount || 0).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <p className="text-[11px] text-gray-600 line-clamp-1 mt-0.5">{o.productName}</p>
                        <span className="text-[10px] text-gray-400 block mt-1">Người nhận: {o.receiverName} ({o.deliverySlot})</span>
                      </div>
                    ))}
                  </div>

                  {browserNotifStatus !== 'granted' && (
                    <button
                      onClick={handleRequestBrowserNotif}
                      className="w-full bg-[#0068FF] hover:bg-blue-600 text-white font-bold py-2 rounded-xl text-center text-[11px] transition-all"
                    >
                      🔔 Bật Thông Báo Nổi Màn Hình Máy Tính
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Profile Admin & Nút Đăng Xuất */}
            <div className="flex items-center gap-2.5 border-l border-white/20 pl-3 sm:pl-4">
              <img
                src={adminUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                alt={adminUser?.name || "Admin"}
                className="w-8 h-8 rounded-full object-cover border-2 border-[#E8998D] shadow-xs"
              />
              <div className="hidden md:block text-left text-xs">
                <span className="font-bold text-white block leading-tight truncate max-w-[130px]">
                  {adminUser?.name || 'Admin Atelier'}
                </span>
                <span className="text-[10px] text-emerald-200">
                  {adminUser?.provider === 'google' ? '🟢 Google SSO' :
                   adminUser?.provider === 'facebook' ? '🔵 Facebook' :
                   adminUser?.provider === 'telegram' ? '✈️ Telegram' : '🔑 Mã PIN'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-red-500/20 text-emerald-100 hover:text-red-200 px-3 py-1.5 rounded-full transition-all text-xs font-semibold border border-white/15 hover:border-red-400/50 ml-1"
                title="Đăng xuất khỏi bảng điều hành"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đăng Xuất</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="bg-white border-b border-[#E8EFEA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2">
          {[
            { id: 'orders', label: 'Quản Lý Đơn Hàng & Cắm Mẫu', icon: ShoppingBag, count: orders.length },
            { id: 'products_cms', label: 'Quản Lý Mẫu Hoa (Storefront CMS)', icon: Flower2, count: products.length },
            { id: 'zalo_config', label: '💬 Cài Đặt Zalo & Telegram Nhận Đơn', icon: Smartphone, badge: 'Đa Kênh' },
            { id: 'inventory', label: 'Tồn Kho Hoa Tươi', icon: Tag, count: inventory.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'orders') resetUnreadOrdersCount();
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1B3B2B] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-[#FAF8F5]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="text-[10px] bg-[#0068FF] text-white px-2 py-0.5 rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: QUẢN LÝ ĐƠN HÀNG */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Banner Trạng Thái Nhận Đơn Realtime */}
            <div className="bg-gradient-to-r from-[#1B3B2B] to-[#264A37] text-white p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <h4 className="font-serif text-base font-bold">Đang Trực Đơn Thời Gian Thực (Realtime Active)</h4>
                  <p className="text-[11px] text-emerald-200">
                    Khi khách đặt đơn, hệ thống sẽ tự động phát chuông và đẩy đơn lên đầu danh sách.
                  </p>
                </div>
              </div>

              {browserNotifStatus !== 'granted' && (
                <button
                  onClick={handleRequestBrowserNotif}
                  className="bg-white text-[#1B3B2B] hover:bg-emerald-50 text-xs font-bold px-4 py-2 rounded-full transition-all shadow-sm"
                >
                  🔔 Bật Thông Báo Desktop
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E8EFEA]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#5C8A70]" />
                <span className="text-xs font-bold text-gray-700">Trạng thái:</span>
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'ARRANGING', label: 'Đang cắm' },
                  { id: 'PHOTO_READY', label: 'Chờ duyệt ảnh' },
                  { id: 'DELIVERING', label: 'Đang ship' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedOrderFilter(f.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                      selectedOrderFilter === f.id ? 'bg-[#1B3B2B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-500">Hiển thị <strong>{filteredOrders.length}</strong> đơn hoa</span>
            </div>

            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="font-serif text-lg font-bold text-[#1B3B2B]">#{order.orderCode || order.id}</span>
                    <span className="text-xs font-bold text-[#1B3B2B] font-sans">{Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 space-y-2 text-xs">
                      <h4 className="font-serif text-base font-bold text-[#1B3B2B]">{order.productName}</h4>
                      <p className="p-3 bg-[#FFFDF9] rounded-xl border border-dashed border-[#E8998D] italic">"{order.cardMessage}"</p>
                      
                      <div className="bg-[#FAF8F5] p-3 rounded-xl space-y-1">
                        <p>Người đặt: <strong>{order.customerName}</strong> (<span className="text-[#0068FF] font-bold">{order.customerPhone}</span>)</p>
                        <p>Người nhận: <strong>{order.receiverName}</strong> ({order.receiverPhone})</p>
                        <p>Địa chỉ: {order.receiverAddress}</p>
                        <p className="text-[#C4685A] font-bold pt-1">⏱️ Khung giờ: {order.deliverySlot}</p>
                      </div>
                    </div>

                    <div className="lg:col-span-5 bg-[#F4F7F5] p-4 rounded-2xl border border-[#D1DFD6] flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-xs font-bold text-[#1B3B2B] block mb-2">📸 Ảnh Chụp Hoa Thật Tại Xưởng:</span>
                        {order.proofPhotoUrl ? (
                          <img src={order.proofPhotoUrl} alt="Proof" className="aspect-[4/3] rounded-xl object-cover border-2 border-white shadow-xs" />
                        ) : (
                          <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-white">
                            <span>Chưa có ảnh chụp thực tế</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-1">
                        <button
                          onClick={() => setPrintOrder(order)}
                          className="w-full bg-[#1B3B2B] hover:bg-[#264A37] text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                          title="In phiếu giao hoa và thiệp chúc mừng kẹp vào bó hoa"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#F5D6CE]" />
                          <span>🖨️ In Phiếu Giao & Thiệp Kẹp Hoa</span>
                        </button>

                        <button
                          onClick={() => handleOpenPersonalZaloForOrder(order)}
                          className="w-full bg-[#0068FF] hover:bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          title="Tự động copy tin nhắn duyệt ảnh và mở Zalo của khách hàng"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Mở Zalo Cá Nhân Gửi Ảnh Cho Khách</span>
                        </button>

                        {!order.proofPhotoUrl ? (
                          <button onClick={() => handleUploadProofPhoto(order.id)} className="w-full bg-[#3B5A45] hover:bg-[#2e4736] text-white text-xs font-bold py-2.5 rounded-xl">
                            Chụp/Tải Ảnh Lên Hệ Thống
                          </button>
                        ) : (
                          <button onClick={() => handleSendToShipper(order.id)} className="w-full bg-[#2E7D32] text-white text-xs font-bold py-2.5 rounded-xl">
                            Bàn Giao Shipper Đi Giao
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ SẢN PHẨM (CMS) */}
        {activeTab === 'products_cms' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#1B3B2B]">
                  Quản Lý Mẫu Hoa Hiển Thị Ra Trang Khách
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Thêm mẫu hoa mới, chỉnh sửa giá bán, cập nhật ảnh và bật/tắt hiển thị ra trang chủ ngay lập tức.
                </p>
              </div>

              <button
                onClick={handleOpenAddModal}
                className="bg-[#1B3B2B] hover:bg-[#264A37] text-white text-xs font-bold px-5 py-3 rounded-full shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4 text-[#F5D6CE]" />
                <span>+ Thêm Bó Hoa Mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div key={prod.id} className="bg-white rounded-2xl border border-[#E8EFEA] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold bg-[#1B3B2B] text-white px-2.5 py-0.5 rounded-full shadow-sm">
                        Dịp: {OCCASIONS.find(o => o.id === prod.occasion)?.label || prod.occasion}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => toggleProductAvailability(prod.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 transition-all ${
                          prod.isAvailable !== false
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {prod.isAvailable !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{prod.isAvailable !== false ? 'Đang hiển thị' : 'Đã ẩn'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-serif text-base font-bold text-[#1B3B2B] line-clamp-1">{prod.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{prod.subtitle}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Giá niêm yết:</span>
                        <span className="text-base font-bold text-[#C4685A] font-sans">
                          {prod.price?.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleOpenEditModal(prod)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteProduct(prod.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CÀI ĐẶT ZALO & THÔNG BÁO ĐƠN HÀNG ĐA KÊNH */}
        {activeTab === 'zalo_config' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Cài Đặt SĐT Zalo & Telegram (7 Cột) */}
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm space-y-5">
                <h4 className="font-serif text-lg font-bold text-[#1B3B2B] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#0068FF]" />
                  Cấu Hình Kênh Nhận Đơn Hàng Tức Thì
                </h4>

                <form onSubmit={handleSaveZaloSettings} className="space-y-5 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      1. Số Điện Thoại Zalo Cá Nhân Của Bạn:
                    </label>
                    <input
                      type="tel"
                      required
                      value={inputShopPhone}
                      onChange={(e) => setInputShopPhone(e.target.value)}
                      placeholder="Ví dụ: 0909123456"
                      className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0068FF] text-sm font-semibold"
                    />
                  </div>

                  <div className="pt-3 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-gray-700 text-xs">
                        2. Cấu Hình Bot Telegram Nhận Đơn (Miễn phí 100%):
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowTelegramGuide(!showTelegramGuide)}
                        className="text-[#0068FF] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{showTelegramGuide ? 'Ẩn Hướng Dẫn' : 'Xem Các Cách Lấy Chat ID'}</span>
                        {showTelegramGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* BOX HƯỚNG DẪN TỪNG BƯỚC LẤY TELEGRAM TOKEN & CHAT ID */}
                    {showTelegramGuide && (
                      <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl text-[11px] text-gray-700 space-y-3 animate-fade-in">
                        <strong className="text-sky-900 block font-serif text-xs">
                          📖 3 Bước Lấy Bot Token & Chat ID Nhanh Nhất:
                        </strong>

                        <div className="space-y-2.5 pl-1">
                          <div className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">1</span>
                            <div>
                              <span>Mở Telegram → Tìm kiếm </span>
                              <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-700 font-bold underline inline-flex items-center gap-0.5">
                                @BotFather <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                              <span> → Bấm <strong>Start</strong> → Gõ <code>/newbot</code>. Nhập tên bot → Nhận chuỗi <strong>HTTP API Token</strong> (dán vào ô Bot Token bên dưới).</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">2</span>
                            <div>
                              <span>Mở bot bạn vừa tạo trên Telegram → Bấm <strong>Start</strong> hoặc gửi chữ <code>Hi</code> đến bot.</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">3</span>
                            <div className="space-y-1">
                              <span><strong>Lấy Chat ID (Chọn 1 trong 2 cách cực dễ):</strong></span>
                              <p className="text-sky-950 bg-white/80 p-2 rounded-lg border border-sky-200">
                                ⚡ <strong>Cách 1 (Dễ nhất):</strong> Sau khi gửi tin nhắn cho bot ở Bước 2, bạn chỉ cần bấm nút màu xanh <strong>"🔍 Tự Động Dò Tìm Chat ID Của Tôi"</strong> bên dưới, hệ thống sẽ tự động điền ID cho bạn!
                              </p>
                              <p className="text-gray-600">
                                🤖 <strong>Cách 2 (Dùng bot tra cứu):</strong> Mở <a href="https://t.me/myidbot" target="_blank" rel="noreferrer" className="text-sky-700 font-bold underline inline-flex items-center gap-0.5">@myidbot <ExternalLink className="w-2.5 h-2.5" /></a> hoặc <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-sky-700 font-bold underline inline-flex items-center gap-0.5">@userinfobot <ExternalLink className="w-2.5 h-2.5" /></a> → Bấm Start để xem số ID của bạn.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-[11px] text-gray-700 font-bold block mb-1">Telegram Bot Token:</span>
                      <input
                        type="text"
                        value={inputBotToken}
                        onChange={(e) => setInputBotToken(e.target.value)}
                        placeholder="VD: 7123456789:AAHk_XYZ..."
                        className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] text-gray-700 font-bold">Telegram Chat ID:</span>
                        <button
                          type="button"
                          onClick={handleAutoDetectChatId}
                          disabled={isDetectingChatId}
                          className="text-[#0068FF] hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 transition-all"
                        >
                          <Search className="w-3 h-3" />
                          <span>{isDetectingChatId ? 'Đang dò tìm...' : '🔍 Tự Động Dò Tìm Chat ID Của Tôi'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={inputChatId}
                        onChange={(e) => setInputChatId(e.target.value)}
                        placeholder="VD: 987654321 hoặc bấm nút Tự Động Dò Tìm ở trên"
                        className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none font-mono text-[11px]"
                      />
                    </div>

                    {/* Thông báo kết quả dò tìm tự động */}
                    {autoDetectMsg && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${autoDetectMsg.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}`}>
                        {autoDetectMsg.success ? <CheckCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                        <span>{autoDetectMsg.text}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleTestTelegram}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                      >
                        <MessageSquareShare className="w-3.5 h-3.5" />
                        <span>Gửi Thử Tin Nhắn Tới Telegram Của Bạn</span>
                      </button>
                    </div>

                    {telegramStatus && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${telegramStatus.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                        {telegramStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <X className="w-4 h-4 text-red-600 flex-shrink-0" />}
                        <span>{telegramStatus.message}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#1B3B2B] hover:bg-[#264A37] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-95 text-xs"
                  >
                    Lưu Cài Đặt Thông Báo
                  </button>

                  {saveZaloSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã lưu thành công cài đặt!</span>
                    </div>
                  )}
                </form>
              </div>

              {/* QR Code Zalo Cá Nhân & Test Âm Thanh (5 Cột) */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm flex flex-col items-center justify-between text-center space-y-4">
                <h4 className="font-serif text-base font-bold text-[#1B3B2B]">
                  Mã QR Kết Bạn Zalo Cá Nhân
                </h4>

                <div className="w-36 h-36 bg-gray-50 p-2.5 rounded-2xl border-2 border-dashed border-[#0068FF] shadow-sm flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://zalo.me/${shopZaloPhone.replace(/\s+/g, '')}`}
                    alt="Zalo QR"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="w-full p-4 bg-[#FAF8F5] rounded-2xl text-xs space-y-2 text-left">
                  <strong className="text-gray-800 block">🔊 Kiểm tra âm thanh chuông báo:</strong>
                  <div className="flex items-center justify-between">
                    <span>Chuông Web Audio API:</span>
                    <button
                      onClick={playTestChime}
                      className="px-3 py-1 bg-[#1B3B2B] text-white rounded-lg text-[11px] font-bold"
                    >
                      Phát Thử Chuông
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: TỒN KHO */}
        {activeTab === 'inventory' && (
          <div className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm space-y-6">
            <h3 className="font-serif text-xl font-bold text-[#1B3B2B]">Quản Lý Kho Hoa Tươi</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 bg-[#FAF8F5]">
                    <th className="p-3.5">Loài Hoa Nhập Khẩu</th>
                    <th className="p-3.5">Tổng Nhập Sáng</th>
                    <th className="p-3.5">Đã Cắm Vào Đơn</th>
                    <th className="p-3.5">Còn Lại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventory.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3.5 font-bold text-gray-900">{item.name}</td>
                      <td className="p-3.5 text-gray-600">{item.total} {item.unit}</td>
                      <td className="p-3.5 text-amber-700 font-semibold">{item.used} {item.unit}</td>
                      <td className="p-3.5 font-extrabold text-[#1B3B2B]">{item.remain} {item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* MODAL THÊM / SỬA MẪU HOA */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-gray-200 animate-fade-in my-auto">
            <div className="bg-[#1B3B2B] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">
                {editingProductId ? '✏️ Chỉnh Sửa Mẫu Hoa' : '🌸 Thêm Mẫu Bó Hoa Mới'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-white/80 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tên bó hoa *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Bó Hoa Juliet Hoàng Hôn"
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mô tả ngắn *</label>
                <input
                  type="text"
                  required
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="VD: Hoa hồng cam spirit phối cùng baby trắng"
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Giá gốc *</label>
                  <input
                    type="number"
                    required
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Dịp tặng hoa</label>
                  <select
                    value={formData.occasion}
                    onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none bg-white"
                  >
                    {OCCASIONS.filter(o => o.id !== 'all').map(o => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tone màu chủ đạo</label>
                  <select
                    value={formData.colorTone}
                    onChange={(e) => setFormData({ ...formData, colorTone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none bg-white"
                  >
                    {COLOR_TONES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Đường dẫn ảnh (URL) *</label>
                <input
                  type="url"
                  required
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#1B3B2B] hover:bg-[#264A37] text-white font-bold py-3 rounded-full shadow-md"
                >
                  {editingProductId ? 'Lưu Thay Đổi' : '+ Đăng Bán Lên Cửa Hàng'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 border border-gray-300 text-gray-600 rounded-full"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal In Phiếu Giao Hoa & Thiệp */}
      <PrintInvoiceModal
        isOpen={Boolean(printOrder)}
        onClose={() => setPrintOrder(null)}
        order={printOrder}
      />

    </div>
  );
};
