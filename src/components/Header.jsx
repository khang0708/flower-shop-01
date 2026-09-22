import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  ShoppingBag, 
  Heart, 
  Sparkles, 
  Search, 
  Phone, 
  PackageCheck,
  Menu,
  X
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

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8EFEA]">
      {/* Top Banner Thông Báo Khách Hàng - Responsive Toàn Diện */}
      <div className="bg-[#1B3B2B] text-[#E8EFEA] text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Thông tin Freeship & Cam kết */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <span className="flex items-center gap-1 truncate font-medium">
              <span className="flex-shrink-0">🚚</span>
              <strong className="font-bold hidden xs:inline">Freeship 4km</strong>
              <span className="hidden xs:inline">từ 600k</span>
              <span className="xs:hidden font-semibold truncate">Freeship 4km từ 600k</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-emerald-200">
              📸 <strong>Chụp ảnh hoa thật</strong> gửi duyệt trước khi ship
            </span>
          </div>

          {/* Hotline & Zalo Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <a 
              href={`tel:${shopZaloPhone.replace(/\s+/g, '')}`} 
              className="hover:text-white font-semibold flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap bg-white/10 sm:bg-transparent px-2 sm:px-0 py-0.5 sm:py-0 rounded-full"
              title={`Hotline / Zalo: ${shopZaloPhone}`}
            >
              <span className="hidden xs:inline">Hotline/Zalo:</span>
              <span className="xs:hidden">📞</span>
              <strong>{shopZaloPhone}</strong>
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
              placeholder="Tìm hoa tươi, rạp cưới hỏi, giỏ trái cây..."
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

      {/* 3 Trụ Cột Danh Mục Navigation Bar (Desktop & Tablet) */}
      <div className="border-t border-[#E8EFEA]/80 bg-white/70 backdrop-blur-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center sm:justify-start gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1 hidden sm:inline">
            Danh mục:
          </span>
          {[
            { id: 'flowers', label: 'Hoa Tươi Nghệ Thuật', icon: '🌸', badge: 'Cắm mới mỗi ngày' },
            { id: 'weddings', label: 'Rạp Cưới Hỏi & Gia Tiên', icon: '🎪', badge: 'Khảo sát 0đ' },
            { id: 'fruits', label: 'Giỏ Trái Cây & Quà Tặng', icon: '🍇', badge: '100% Nhập khẩu' },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <a
                key={cat.id}
                href="#catalog"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1B3B2B] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#1B3B2B] hover:bg-gray-100/80 border border-transparent'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-normal hidden md:inline ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {cat.badge}
                </span>
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
              className={`py-2 px-2 rounded-lg flex items-center justify-between ${
                activeCategory === 'flowers' ? 'bg-[#1B3B2B] text-white font-bold' : 'hover:bg-gray-50'
              }`}
            >
              <span>🌸 Hoa Tươi Nghệ Thuật</span>
              <span className="text-[11px] opacity-70">Cắm mới mỗi ngày</span>
            </a>
            <a 
              href="#catalog" 
              onClick={() => {
                setActiveCategory('weddings');
                setMobileMenuOpen(false);
              }} 
              className={`py-2 px-2 rounded-lg flex items-center justify-between ${
                activeCategory === 'weddings' ? 'bg-[#1B3B2B] text-white font-bold' : 'hover:bg-gray-50'
              }`}
            >
              <span>🎪 Rạp Cưới Hỏi & Gia Tiên</span>
              <span className="text-[11px] opacity-70">Khảo sát 0đ</span>
            </a>
            <a 
              href="#catalog" 
              onClick={() => {
                setActiveCategory('fruits');
                setMobileMenuOpen(false);
              }} 
              className={`py-2 px-2 rounded-lg flex items-center justify-between ${
                activeCategory === 'fruits' ? 'bg-[#1B3B2B] text-white font-bold' : 'hover:bg-gray-50'
              }`}
            >
              <span>🍇 Giỏ Trái Cây & Quà Tặng</span>
              <span className="text-[11px] opacity-70">100% Nhập khẩu</span>
            </a>
            <a 
              href="#reviews-section" 
              onClick={() => setMobileMenuOpen(false)} 
              className="py-2.5 px-2 rounded-lg hover:bg-gray-50 flex items-center justify-between mt-1 pt-2 border-t border-gray-100"
            >
              <span>⭐ Cảm nhận khách hàng thực tế</span>
              <span className="text-gray-400">→</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
