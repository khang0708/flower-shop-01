import React from 'react';
import { useShop } from '../context/ShopContext';
import { 
  SHOP_CATEGORIES, 
  OCCASIONS, 
  COLOR_TONES, 
  WEDDING_TYPES, 
  FRUIT_OCCASIONS 
} from '../data/flowers';
import { Palette, CheckCircle, ShieldCheck } from 'lucide-react';

export const OccasionFilter = () => {
  const { 
    activeCategory,
    setActiveCategory,
    selectedOccasion, 
    setSelectedOccasion, 
    selectedColor, 
    setSelectedColor,
    selectedWeddingType,
    setSelectedWeddingType,
    selectedFruitType,
    setSelectedFruitType
  } = useShop();

  const currentCategoryObj = SHOP_CATEGORIES.find(c => c.id === activeCategory) || SHOP_CATEGORIES[0];

  return (
    <div id="catalog" className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-2 sm:pt-6 pb-2 sm:pb-3">
      {/* TIÊU ĐỀ THEO TRỤ CỘT ĐANG CHỌN */}
      <div className="text-center mb-2.5 sm:mb-5">
        <h2 className="font-serif text-lg sm:text-3xl text-[#1B3B2B] font-bold flex items-center justify-center gap-1.5 sm:gap-2">
          <span>{currentCategoryObj.name}</span>
          <span className="text-base sm:text-2xl">{currentCategoryObj.icon}</span>
        </h2>
        <p className="hidden sm:block text-xs sm:text-sm text-gray-500 mt-1 max-w-xl mx-auto px-2">
          {currentCategoryObj.description}
        </p>
      </div>

      {/* 3. BỘ LỌC CON THEO TỪNG DANH MỤC */}
      {/* TH1: HOA TƯƠI NGHỆ THUẬT */}
      {activeCategory === 'flowers' && (
        <div className="space-y-2 sm:space-y-3 animate-fade-in">
          {/* Row 1: Occasions Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-2.5 px-2.5 sm:mx-0 sm:px-0">
            {OCCASIONS.map((occ) => {
              const isActive = selectedOccasion === occ.id;
              return (
                <button
                  key={occ.id}
                  onClick={() => setSelectedOccasion(occ.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#1B3B2B] text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-[#F4F7F5] border border-[#D1DFD6]'
                  }`}
                >
                  <span className="text-xs sm:text-sm">{occ.icon}</span>
                  <span>{occ.label}</span>
                </button>
              );
            })}
          </div>

          {/* Row 2: Color Tone Filter (Một dòng duy nhất, cuộn mượt không bị vỡ dòng) */}
          <div className="pt-2 sm:pt-2.5 border-t border-[#E8EFEA]/80 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-2.5 px-2.5 sm:mx-0 sm:px-0">
            <div className="flex items-center gap-1 text-xs font-bold text-gray-600 shrink-0">
              <Palette className="w-3.5 h-3.5 text-[#5C8A70]" />
              <span className="text-[11px] sm:text-xs">Tone màu:</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {COLOR_TONES.map((ct) => {
                const isColorActive = selectedColor === ct.id;
                return (
                  <button
                    key={ct.id}
                    onClick={() => setSelectedColor(ct.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isColorActive
                        ? 'border-[#1B3B2B] bg-[#1B3B2B] text-white font-semibold shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {ct.id !== 'all' && (
                      <span 
                        className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block shrink-0" 
                        style={{ backgroundColor: ct.color }}
                      />
                    )}
                    <span>{ct.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TH2: TRÁP CƯỚI */}
      {activeCategory === 'weddings' && (
        <div className="space-y-2 sm:space-y-3 animate-fade-in">
          {/* Row 1: Wedding Types Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-2.5 px-2.5 sm:mx-0 sm:px-0">
            {WEDDING_TYPES.map((wt) => {
              const isActive = selectedWeddingType === wt.id;
              return (
                <button
                  key={wt.id}
                  onClick={() => setSelectedWeddingType(wt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#1B3B2B] text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-[#F4F7F5] border border-[#D1DFD6]'
                  }`}
                >
                  <span className="text-xs sm:text-sm">{wt.icon}</span>
                  <span>{wt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Row 2: Wedding Value Proposition Banner */}
          <div className="pt-2 sm:pt-2.5 border-t border-[#E8EFEA]/80 flex flex-wrap items-center justify-center sm:justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-gray-600 bg-white/60 p-2 sm:p-2.5 rounded-xl border border-gray-100">
            <div className="flex items-center gap-1.5 text-[#1B3B2B] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5C8A70]" />
              <span>Tư vấn mẫu tráp cưới tận nơi 0đ</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#1B3B2B] font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-[#C4685A]" />
              <span>Lễ vật tươi mới, kết rồng phụng 3D</span>
            </div>
            <div className="text-gray-500 font-medium hidden sm:block">
              ✨ Hợp đồng rõ ràng • Đúng giờ hoàng đạo
            </div>
          </div>
        </div>
      )}

      {/* TH3: GIỎ TRÁI CÂY & QUÀ TẶNG */}
      {activeCategory === 'fruits' && (
        <div className="space-y-2 sm:space-y-3 animate-fade-in">
          {/* Row 1: Fruit Occasions Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-2.5 px-2.5 sm:mx-0 sm:px-0">
            {FRUIT_OCCASIONS.map((fo) => {
              const isActive = selectedFruitType === fo.id;
              return (
                <button
                  key={fo.id}
                  onClick={() => setSelectedFruitType(fo.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#1B3B2B] text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-[#F4F7F5] border border-[#D1DFD6]'
                  }`}
                >
                  <span className="text-xs sm:text-sm">{fo.icon}</span>
                  <span>{fo.label}</span>
                </button>
              );
            })}
          </div>

          {/* Row 2: Fruit Value Proposition Banner */}
          <div className="pt-2 sm:pt-2.5 border-t border-[#E8EFEA]/80 flex flex-wrap items-center justify-center sm:justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-gray-600 bg-white/60 p-2 sm:p-2.5 rounded-xl border border-gray-100">
            <div className="flex items-center gap-1.5 text-[#1B3B2B] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5C8A70]" />
              <span>100% Trái cây nhập khẩu tem mác chính hãng</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#1B3B2B] font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-[#C4685A]" />
              <span>Kết hoa tươi thủ công sang trọng</span>
            </div>
            <div className="text-gray-500 font-medium hidden sm:block">
              🎁 Tặng kèm thiệp & ruy băng cao cấp
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
