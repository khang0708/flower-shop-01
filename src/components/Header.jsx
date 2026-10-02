import React, { useState, useRef, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  ShoppingBag, 
  Heart, 
  Sparkles, 
  Search, 
  Phone, 
  PackageCheck,
  Menu,
  X,
  Lock
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const Header = () => {
  const { 
    cart, 
    wishlist, 
    setIsCartOpen, 
    setIsAIFloristOpen, 
    setIsTrackingOpen,
    searchQuery,
    setSearchQuery,
    activeOrder,
    shopZaloPhone,
    activeCategory,
    setActiveCategory
  } = useShop();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const categoryNavRef = useRef(null);

  // Tự động căn chỉnh nhẹ nhàng tab danh mục đang chọn vào tầm nhìn trên mobile mà không cắt đầu cắt đuôi
  useEffect(() => {
    if (categoryNavRef.current) {
      const activeEl = categoryNavRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        const container = categoryNavRef.current;
        const scrollTarget = activeEl.offsetLeft - (container.clientWidth - activeEl.clientWidth) / 2;
        container.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' });
      }
    }
  }, [activeCategory]);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8EFEA]">

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
          
          <a href="#" aria-label="Trang chủ Ngọc Flower" className="group">
            <BrandLogo variant="horizontal" size="md" theme="dark" />
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
              placeholder="Tìm hoa tươi, tráp cưới hỏi, giỏ trái cây..."
              aria-label="Tìm kiếm sản phẩm hoặc dịch vụ"
              className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-white border border-[#D1DFD6] focus:outline-none focus:border-[#1B3B2B] focus:ring-1 focus:ring-[#1B3B2B] transition-all"
            />
          </div>
        </div>

        {/* Action Buttons Cho Khách Hàng */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Nút Theo dõi đơn hàng (Live Tracking) */}
          <button
            onClick={() => setIsTrackingOpen(true)}
            className="flex items-center gap-1 text-xs font-medium text-[#1B3B2B] bg-white border border-[#D1DFD6] hover:bg-[#F4F7F5] px-3 py-2 rounded-full transition-all relative"
            title="Xem tiến trình cắm & duyệt ảnh hoa thật"
            aria-label="Theo dõi đơn hoa trực tiếp"
          >
            <PackageCheck className="w-3.5 h-3.5 text-[#5C8A70]" />
            <span className="hidden md:inline">Đơn hàng của tôi</span>
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

      {/* 3 Trụ Cột Danh Mục Navigation Bar (Mobile / Tablet / Desktop) */}
      <div className="border-t border-[#E8EFEA]/80 bg-white/80 backdrop-blur-xs py-2 px-3 sm:px-4">
        <div 
          ref={categoryNavRef}
          className="max-w-7xl mx-auto flex items-center justify-start sm:justify-center gap-2 overflow-x-auto scrollbar-none text-xs overscroll-x-contain py-0.5"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1 hidden sm:inline shrink-0">
            Danh mục:
          </span>
          {[
            { id: 'flowers', label: 'Hoa Tươi', icon: '🌸' },
            { id: 'weddings', label: 'Tráp Cưới', icon: '🧧' },
            { id: 'fruits', label: 'Giỏ Trái Cây', icon: '🍇' },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <a
                key={cat.id}
                href="#catalog"
                data-active={isActive ? 'true' : 'false'}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#1B3B2B] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#1B3B2B] hover:bg-gray-100/80 bg-gray-50/70 border border-transparent'
                }`}
              >
                <span className="shrink-0">{cat.icon}</span>
                <span>{cat.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E8EFEA] p-4 space-y-4 shadow-lg animate-fade-in">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm hoa theo tên, loài hoa (Juliet, Baby...)"
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full bg-[#FAF8F5] border border-[#D1DFD6] focus:outline-none focus:border-[#1B3B2B]"
            />
          </div>

          {/* Quick Action Badges on Mobile */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`tel:${shopZaloPhone.replace(/\s+/g, '')}`}
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hotline: {shopZaloPhone}</span>
            </a>

            <button
              onClick={() => {
                setIsTrackingOpen(true);
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-[#FAF8F5] text-gray-700 border border-gray-200"
            >
              <PackageCheck className="w-3.5 h-3.5 text-[#5C8A70]" />
              <span>Đơn Hoa Của Tôi</span>
            </button>
          </div>

          <div className="flex flex-col gap-1 text-xs font-medium text-[#1B3B2B] pt-2 border-t border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400 px-2 pt-1">Danh mục sản phẩm:</span>
            <a 
              href="#catalog" 
              onClick={() => {
                setActiveCategory('flowers');
                setMobileMenuOpen(false);
              }} 
              className={`py-2 px-2.5 rounded-lg flex items-center justify-between ${
                activeCategory === 'flowers' ? 'bg-[#1B3B2B] text-white font-bold' : 'hover:bg-gray-50'
              }`}
            >
              <span>🌸 Hoa Tươi Buôn Ma Thuột</span>
              <span className="text-gray-400">→</span>
            </a>
            <a 
              href="#catalog" 
              onClick={() => {
                setActiveCategory('weddings');
                setMobileMenuOpen(false);
              }} 
              className={`py-2 px-2.5 rounded-lg flex items-center justify-between ${
                activeCategory === 'weddings' ? 'bg-[#1B3B2B] text-white font-bold' : 'hover:bg-gray-50'
              }`}
            >
              <span>🧧 Tráp Cưới</span>
              <span className="text-gray-400">→</span>
            </a>
            <a 
              href="#catalog" 
              onClick={() => {
                setActiveCategory('fruits');
                setMobileMenuOpen(false);
              }} 
              className={`py-2 px-2.5 rounded-lg flex items-center justify-between ${
                activeCategory === 'fruits' ? 'bg-[#1B3B2B] text-white font-bold' : 'hover:bg-gray-50'
              }`}
            >
              <span>🍇 Giỏ Trái Cây</span>
              <span className="text-gray-400">→</span>
            </a>
            <a 
              href="#reviews-section" 
              onClick={() => setMobileMenuOpen(false)} 
              className="py-2.5 px-2 rounded-lg hover:bg-gray-50 flex items-center justify-between mt-1 pt-2 border-t border-gray-100"
            >
              <span>⭐ Cảm nhận khách hàng thực tế</span>
              <span className="text-gray-400">→</span>
            </a>
            <button 
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                window.location.hash = 'admin';
              }} 
              className="w-full py-2.5 px-2 rounded-lg hover:bg-gray-50 flex items-center justify-between mt-1 text-gray-500 hover:text-[#1B3B2B] text-xs cursor-pointer border-t border-gray-100"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cổng Quản Trị / Nội Bộ</span>
              </span>
              <span className="text-gray-400">🔒</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
