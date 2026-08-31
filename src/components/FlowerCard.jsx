import React from 'react';
import { useShop } from '../context/ShopContext';
import { Heart, Star, Sparkles, Plus, Eye, Check } from 'lucide-react';

export const FlowerCard = ({ flower }) => {
  const { wishlist, toggleWishlist, addToCart, setQuickViewProduct } = useShop();
  const isLiked = wishlist.includes(flower.id);

  return (
    <div className="group bg-white rounded-organic overflow-hidden shadow-organic-soft hover:shadow-xl transition-all duration-500 flex flex-col border border-[#E8EFEA] hover:border-[#D1DFD6]">
      
      {/* 4:5 Aspect Ratio Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-paper">
        <img
          src={flower.image}
          alt={`Mẫu hoa tươi ${flower.name} - Flora & Bloom`}
          width="320"
          height="400"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
          decoding="async"
        />

        {/* Overlay Dark Gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {flower.tags?.map((t, idx) => (
            <span 
              key={idx} 
              className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-pill backdrop-blur-md shadow-sm w-fit ${
                idx === 0 ? 'bg-white/90 text-[#1B3B2B]' : 'bg-[#F5D6CE]/90 text-[#C4685A]'
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
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-700 hover:text-[#C4685A] transition-all shadow-sm z-10 active:scale-90"
          aria-label="Yêu thích"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#C4685A] text-[#C4685A]' : 'stroke-current'}`} />
        </button>

        {/* Hover Quick View Button */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
          <button
            onClick={() => setQuickViewProduct(flower)}
            className="flex-1 bg-white/95 hover:bg-white text-[#1B3B2B] text-xs font-semibold py-2.5 rounded-full shadow-md backdrop-blur-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Tùy Biến Bó Hoa</span>
          </button>
        </div>

      </div>

      {/* Product Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between bg-white">
        
        <div>
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
            <span className="flex items-center gap-1 text-amber-500 font-semibold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{flower.rating}</span>
              <span className="text-gray-400 font-normal">({flower.reviewsCount})</span>
            </span>
            <span className="text-emerald-700 font-medium">🌿 Tươi {flower.freshDays}+ ngày</span>
          </div>

          <h3 
            onClick={() => setQuickViewProduct(flower)}
            className="font-serif text-base sm:text-lg text-[#1B3B2B] font-bold group-hover:text-[#C4685A] transition-colors cursor-pointer line-clamp-1"
          >
            {flower.name}
          </h3>

          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {flower.subtitle}
          </p>

          {/* Loài hoa thành phần */}
          <div className="mt-2.5 flex flex-wrap gap-1">
            {flower.flowerTypes?.slice(0, 3).map((ft, i) => (
              <span key={i} className="text-[10px] bg-[#F4F7F5] text-[#345543] px-2 py-0.5 rounded-md font-medium">
                {ft}
              </span>
            ))}
          </div>
        </div>

        {/* Price & Action */}
        <div className="mt-4 pt-3 border-t border-[#E8EFEA] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 block font-medium">Giá tiêu chuẩn</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold text-[#1B3B2B] font-sans">
                {flower.price.toLocaleString('vi-VN')}đ
              </span>
              {flower.originalPrice && (
                <span className="text-xs text-gray-400 line-through">
                  {flower.originalPrice.toLocaleString('vi-VN')}đ
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => addToCart(flower)}
            className="bg-[#1B3B2B] hover:bg-[#264A37] text-white text-xs font-semibold px-3.5 py-2 rounded-full shadow-sm transition-all flex items-center gap-1 active:scale-95"
            title="Thêm nhanh vào giỏ"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đặt Nhanh</span>
          </button>
        </div>

      </div>

    </div>
  );
};
