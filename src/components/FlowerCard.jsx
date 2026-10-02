import React from 'react';
import { useShop } from '../context/ShopContext';
import { Heart, Star, Plus, Eye, Check, MessageCircle, CalendarCheck, Sparkles } from 'lucide-react';
import { openPersonalZaloChat } from '../services/zaloService';

export const FlowerCard = ({ flower }) => {
  const { wishlist, toggleWishlist, addToCart, setQuickViewProduct, shopZaloPhone } = useShop();
  const isLiked = wishlist.includes(flower.id);
  const isWedding = flower.category === 'weddings';
  const isFruit = flower.category === 'fruits';

  const handleZaloInquiry = (e) => {
    e.stopPropagation();
    let message = '';
    if (isWedding) {
      message = `Chào shop Ngọc Flower, tôi quan tâm gói dịch vụ "${flower.name}" (giá tham khảo từ ${flower.price.toLocaleString('vi-VN')}đ). Xin tư vấn chi tiết và sắp xếp lịch khảo sát thực tế giúp tôi!`;
    } else if (isFruit) {
      message = `Chào shop Ngọc Flower, tôi muốn nhận báo giá và tư vấn cho mẫu giỏ trái cây "${flower.name}" (Giá: ${flower.price.toLocaleString('vi-VN')}đ).`;
    } else {
      message = `Chào shop Ngọc Flower, tôi muốn nhận báo giá và tư vấn thiết kế cho mẫu hoa tươi "${flower.name}" (Giá: ${flower.price.toLocaleString('vi-VN')}đ).`;
    }
    openPersonalZaloChat(shopZaloPhone, message);
  };

  return (
    <div className="group bg-white rounded-2xl sm:rounded-organic overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col border border-[#E8EFEA] hover:border-[#D1DFD6]">
      
      {/* 4:5 Aspect Ratio Image Container */}
      <div 
        onClick={() => setQuickViewProduct(flower)}
        className="relative aspect-[4/5] overflow-hidden bg-surface-paper cursor-pointer"
      >
        <img
          src={flower.image}
          alt={flower.name}
          width="320"
          height="400"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          decoding="async"
        />

        {/* Overlay Dark Gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10">
          {flower.tags?.slice(0, 2).map((t, idx) => (
            <span 
              key={idx} 
              className={`text-[9px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-pill backdrop-blur-md shadow-xs w-fit ${
                idx > 0 ? 'hidden sm:inline-block' : ''
              } ${
                idx === 0 
                  ? isWedding 
                    ? 'bg-[#1B3B2B]/90 text-white'
                    : 'bg-white/90 text-[#1B3B2B]' 
                  : 'bg-[#F5D6CE]/90 text-[#C4685A]'
              }`}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(flower.id);
          }}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-700 hover:text-[#C4685A] transition-all shadow-xs z-10 active:scale-90 cursor-pointer"
          aria-label="Yêu thích"
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLiked ? 'fill-[#C4685A] text-[#C4685A]' : 'stroke-current'}`} />
        </button>

        {/* Hover Quick View Button */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300 hidden sm:flex gap-2">
          <button
            onClick={() => setQuickViewProduct(flower)}
            className="flex-1 bg-white/95 hover:bg-white text-[#1B3B2B] text-xs font-semibold py-2.5 rounded-full shadow-md backdrop-blur-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isWedding ? 'Xem Chi Tiết Gói' : isFruit ? 'Xem Chi Tiết Giỏ' : 'Tùy Biến Bó Hoa'}</span>
          </button>
        </div>

      </div>

      {/* Product Content */}
      <div className="p-2.5 sm:p-5 flex flex-col flex-grow justify-between bg-white">
        
        <div>
          {/* Rating and highlights */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-gray-500 mb-1">
            <span className="flex items-center gap-0.5 sm:gap-1 text-amber-500 font-semibold">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
              <span>{flower.rating}</span>
              <span className="text-gray-400 font-normal hidden xs:inline">({flower.reviewsCount})</span>
            </span>
            {isWedding ? (
              <span className="text-[#1B3B2B] font-bold text-[9px] sm:text-[11px] flex items-center gap-0.5">
                <CalendarCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#5C8A70]" />
                <span>Tư vấn 0đ</span>
              </span>
            ) : (
              <span className="text-emerald-700 font-medium text-[9px] sm:text-[11px]">🌿 Tươi {flower.freshDays || 5}+ ngày</span>
            )}
          </div>

          {/* Title */}
          <h3 
            onClick={() => setQuickViewProduct(flower)}
            className="font-serif text-xs sm:text-lg text-[#1B3B2B] font-bold group-hover:text-[#C4685A] transition-colors cursor-pointer line-clamp-2 leading-tight sm:leading-normal text-center sm:text-left mt-0.5"
            title={flower.name}
          >
            {flower.name}
          </h3>

          {/* Subtitle - visible on tablet/desktop */}
          <p className="text-[11px] sm:text-xs text-gray-500 mt-1 line-clamp-1 sm:line-clamp-2 leading-relaxed hidden sm:block">
            {flower.subtitle}
          </p>

          {/* Category-Specific Details (Visible on desktop/tablet) */}
          {isWedding && (
            <div className="mt-2 sm:mt-3 p-1.5 sm:p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E8EFEA] space-y-1">
              <div className="text-[10px] sm:text-[11px] font-bold text-[#1B3B2B] flex items-center justify-between">
                <span className="truncate">{flower.scale}</span>
                <span className="text-gray-500 font-normal hidden sm:inline">{flower.setupTime}</span>
              </div>
              <ul className="text-[10px] text-gray-600 space-y-1 hidden sm:block">
                {flower.includedItems?.slice(0, 2).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <Check className="w-3 h-3 text-[#5C8A70] flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isFruit && flower.fruitTypes && (
            <div className="mt-1.5 sm:mt-2.5 hidden sm:flex flex-wrap gap-1">
              {flower.fruitTypes.slice(0, 3).map((ft, i) => (
                <span key={i} className="text-[10px] bg-[#FDF0ED] text-[#C4685A] px-2 py-0.5 rounded-md font-medium">
                  🍎 {ft}
                </span>
              ))}
            </div>
          )}

          {!isWedding && !isFruit && flower.flowerTypes && (
            <div className="mt-1.5 sm:mt-2.5 hidden sm:flex flex-wrap gap-1">
              {flower.flowerTypes.slice(0, 3).map((ft, i) => (
                <span key={i} className="text-[10px] bg-[#F4F7F5] text-[#345543] px-2 py-0.5 rounded-md font-medium">
                  {ft}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price & Action Section */}
        <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-[#E8EFEA] space-y-2">
          {/* Price Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between items-center sm:items-start gap-0.5">
            <div className="text-center sm:text-left">
              <span className="text-[9px] sm:text-[10px] text-gray-400 block font-medium hidden sm:block">
                {isWedding ? 'Giá trọn gói từ' : 'Giá tiêu chuẩn'}
              </span>
              <div className="flex items-baseline justify-center sm:justify-start gap-1 sm:gap-1.5 flex-wrap">
                <span className="text-sm sm:text-lg font-extrabold text-[#1B3B2B] font-sans">
                  {flower.price.toLocaleString('vi-VN')} đ
                </span>
                {flower.originalPrice && (
                  <span className="text-[10px] sm:text-[11px] text-gray-400 line-through">
                    {flower.originalPrice.toLocaleString('vi-VN')} đ
                  </span>
                )}
              </div>
            </div>

            {/* Micro badge */}
            <span className="hidden sm:inline-block text-[10px] text-gray-600 bg-[#FAF8F5] border border-[#E8EFEA] px-2 py-0.5 rounded-md font-medium">
              {isWedding ? 'Tư vấn 0đ' : isFruit ? '100% Nhập khẩu' : 'Chụp ảnh trước'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {isWedding ? (
              <>
                <button
                  type="button"
                  onClick={() => setQuickViewProduct(flower)}
                  className="w-full bg-white hover:bg-gray-50 text-[#1B3B2B] border border-[#D1DFD6] text-[11px] sm:text-xs font-semibold py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">Chi Tiết Gói</span>
                  <span className="sm:hidden">Chi Tiết</span>
                </button>
                <button
                  type="button"
                  onClick={handleZaloInquiry}
                  className="w-full bg-[#0068FF] hover:bg-blue-600 text-white text-[11px] sm:text-xs font-bold py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-lg sm:rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap"
                  title="Nhận báo giá & đặt lịch tư vấn qua Zalo"
                >
                  <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">Báo Giá Zalo</span>
                  <span className="sm:hidden">Zalo</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleZaloInquiry}
                  className="w-full py-1.5 sm:py-2.5 px-1 sm:px-2 bg-blue-50 hover:bg-blue-100 text-[#0068FF] border border-blue-200 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap"
                  title="Nhận báo giá mẫu này qua Zalo"
                >
                  <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">Báo Giá Zalo</span>
                  <span className="sm:hidden">Zalo</span>
                </button>
                <button
                  type="button"
                  onClick={() => addToCart(flower)}
                  className="w-full py-1.5 sm:py-2.5 px-1 sm:px-2 bg-[#1B3B2B] hover:bg-[#264A37] text-white text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap"
                  title="Thêm nhanh vào giỏ hàng"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">Đặt Nhanh</span>
                  <span className="sm:hidden">Đặt Mua</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
