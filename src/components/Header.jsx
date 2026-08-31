import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  ShoppingBag, 
  Heart, 
  Sparkles, 
  Search, 
  Smartphone, 
  PackageCheck,
  Menu,
  X
} from 'lucide-react';

export const Header = () => {
  const { 
    cart, 
    wishlist, 
    setIsCartOpen, 
    setIsAIFloristOpen, 
    setIsTrackingOpen,
    isZaloMode,
    setIsZaloMode,
    searchQuery,
    setSearchQuery,
    activeOrder,
    shopZaloPhone
  } = useShop();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8EFEA]">
      {/* Top Banner Thông Báo Khách Hàng */}
      <div className="bg-[#1B3B2B] text-[#E8EFEA] text-[11px] sm:text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              🚚 <strong>Miễn phí giao hoa 4km đầu</strong> cho đơn từ 600k
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-emerald-200">
              📸 <strong>Chụp ảnh hoa thật</strong> gửi duyệt trước khi ship
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Nút bật/tắt chế độ Zalo Mini App cho khách */}
            <button
              onClick={() => setIsZaloMode(!isZaloMode)}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                isZaloMode 
                  ? 'bg-[#0068FF] text-white shadow-sm' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Chuyển đổi góc nhìn mô phỏng Zalo Mini App"
            >
              <Smartphone className="w-3 h-3" />
              <span>{isZaloMode ? '⚡ Zalo Mini App' : 'Mô phỏng Zalo'}</span>
            </button>
            <span className="text-white/60">|</span>
            <a 
              href={`tel:${shopZaloPhone.replace(/\s+/g, '')}`} 
              className="hover:text-white font-medium flex items-center gap-1"
              title={`Hotline / Zalo: ${shopZaloPhone}`}
            >
              Hotline/Zalo: <strong>{shopZaloPhone}</strong>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-gray-700 hover:text-[#1B3B2B]"
            aria-label="Mở menu di động"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <a href="#" className="flex flex-col" aria-label="Trang chủ Flora & Bloom">
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1B3B2B] leading-none">
              Flora & Bloom
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#C4685A] font-semibold mt-0.5">
              Botanical Atelier
            </span>
          </a>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden lg:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm hoa theo tên, loài hoa (Juliet, Baby, Mẫu đơn...)"
              aria-label="Tìm kiếm mẫu hoa"
              className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-white border border-[#D1DFD6] focus:outline-none focus:border-[#1B3B2B] focus:ring-1 focus:ring-[#1B3B2B] transition-all"
            />
          </div>
        </div>

        {/* Action Buttons Cho Khách Hàng */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Nút Trợ lý AI Florist Vision */}
          <button
            onClick={() => setIsAIFloristOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#1B3B2B] to-[#345543] hover:to-[#1B3B2B] text-white text-xs font-semibold px-3.5 py-2 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 group"
            aria-label="Trợ lý thẩm định hoa AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F5D6CE] group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Thẩm định hoa AI</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* Nút Theo dõi đơn hàng (Live Tracking) */}
          <button
            onClick={() => setIsTrackingOpen(true)}
            className="flex items-center gap-1 text-xs font-medium text-[#1B3B2B] bg-white border border-[#D1DFD6] hover:bg-[#F4F7F5] px-3 py-2 rounded-full transition-all relative"
            title="Xem tiến trình cắm & duyệt ảnh hoa thật"
            aria-label="Theo dõi đơn hoa trực tiếp"
          >
            <PackageCheck className="w-3.5 h-3.5 text-[#5C8A70]" />
            <span className="hidden md:inline">Đơn hoa của tôi</span>
            {activeOrder && (
              <span className="w-2 h-2 rounded-full bg-[#C4685A] animate-ping absolute top-1 right-1" />
            )}
          </button>

          {/* Yêu thích */}
          <button
            className="p-2 text-gray-700 hover:text-[#C4685A] hover:bg-white rounded-full transition-all relative hidden sm:flex"
            title="Danh sách yêu thích"
            aria-label={`Danh sách yêu thích (${wishlist.length} mẫu)`}
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-[#E8998D] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Giỏ hàng */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 bg-[#FAF4F0] hover:bg-[#F5D6CE]/50 text-[#1B3B2B] border border-[#F5D6CE] px-3.5 py-2 rounded-full transition-all active:scale-95 relative"
            aria-label={`Giỏ hàng (${cartItemCount} món)`}
          >
            <ShoppingBag className="w-4 h-4 text-[#C4685A]" />
            <span className="text-xs font-bold font-sans">{cartItemCount}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E8EFEA] p-4 space-y-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm mẫu hoa..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-[#FAF8F5] border border-[#D1DFD6] focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2 text-xs font-medium text-[#1B3B2B]">
            <a href="#" className="py-2 border-b border-gray-100">💐 Tất cả mẫu hoa tươi hôm nay</a>
            <a href="#" className="py-2 border-b border-gray-100">🎂 Hoa sinh nhật & Kỷ niệm</a>
            <a href="#" className="py-2 border-b border-gray-100">🏢 Hoa khai trương tài lộc</a>
            <a href="#" className="py-2 text-[#C4685A] font-semibold">✨ Yêu cầu cắm mẫu hoa thiết kế riêng</a>
          </div>
        </div>
      )}
    </header>
  );
};
