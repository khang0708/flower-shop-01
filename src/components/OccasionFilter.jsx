import React from 'react';
import { useShop } from '../context/ShopContext';
import { 
  SHOP_CATEGORIES, 
  OCCASIONS, 
  COLOR_TONES, 
  WEDDING_TYPES, 
  FRUIT_OCCASIONS 
} from '../data/flowers';
import { Palette, Sparkles, CheckCircle, ShieldCheck } from 'lucide-react';

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
    <div id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
      
      {/* 1. THANH CHUYỂN ĐỔI 3 TRỤ CỘT DANH MỤC (PILLAR SEGMENTED TABS) */}
      <div className="bg-[#FAF8F5] p-1.5 sm:p-2 rounded-3xl border border-[#D1DFD6] shadow-xs max-w-3xl mx-auto mb-8">
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {SHOP_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`py-3 px-2 sm:px-4 rounded-2xl font-bold transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-[#1B3B2B] text-white shadow-md'
                    : 'text-gray-700 hover:text-[#1B3B2B] hover:bg-white/80'
                }`}
              >
                <span className="text-lg sm:text-xl">{cat.icon}</span>
                <div className="text-center sm:text-left">
                  <span className="text-xs sm:text-sm block leading-tight">{cat.name}</span>
                  <span className={`text-[10px] hidden sm:block font-normal mt-0.5 ${
                    isActive ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {cat.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TIÊU ĐỀ THEO TRỤ CỘT ĐANG CHỌN */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 bg-[#F4F7F5] px-3 py-1 rounded-full border border-[#D1DFD6] mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#5C8A70]" />
          <span className="text-[11px] font-bold text-[#1B3B2B] uppercase tracking-wider">
            {currentCategoryObj.badge}
          </span>
        </div>
        <h2 className="font-serif text-2xl sm:text-4xl text-[#1B3B2B] font-bold">
          {currentCategoryObj.name}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-xl mx-auto">
          {currentCategoryObj.description}
        </p>
      </div>

      {/* 3. BỘ LỌC CON THEO TỪNG DANH MỤC */}
      {/* TH1: HOA TƯƠI NGHỆ THUẬT */}
      {activeCategory === 'flowers' && (
        <div className="space-y-4 animate-fade-in">
          {/* Row 1: Occasions Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {OCCASIONS.map((occ) => {
              const isActive = selectedOccasion === occ.id;
              return (
                <button
                  key={occ.id}
                  onClick={() => setSelectedOccasion(occ.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-[#1B3B2B] text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-[#F4F7F5] border border-[#D1DFD6]'
                  }`}
                >
                  <span>{occ.icon}</span>
                  <span>{occ.label}</span>
                </button>
              );
            })}
          </div>

          {/* Row 2: Color Tone Filter */}
          <div className="pt-3 border-t border-[#E8EFEA] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#5C8A70]" />
              <span className="text-xs font-bold text-gray-700">Tone Màu Chủ Đạo:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {COLOR_TONES.map((ct) => {
                const isColorActive = selectedColor === ct.id;
                return (
                  <button
                    key={ct.id}
                    onClick={() => setSelectedColor(ct.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                      isColorActive
                        ? 'border-[#1B3B2B] bg-[#1B3B2B] text-white font-semibold shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {ct.id !== 'all' && (
                      <span 
                        className="w-3 h-3 rounded-full border border-black/10 inline-block" 
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

      {/* TH2: RẠP CƯỚI HỎI & GIA TIÊN */}
      {activeCategory === 'weddings' && (
        <div className="space-y-4 animate-fade-in">
          {/* Row 1: Wedding Types Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {WEDDING_TYPES.map((wt) => {
              const isActive = selectedWeddingType === wt.id;
              return (
                <button
                  key={wt.id}
                  onClick={() => setSelectedWeddingType(wt.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-[#1B3B2B] text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-[#F4F7F5] border border-[#D1DFD6]'
                  }`}
                >
                  <span>{wt.icon}</span>
                  <span>{wt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Row 2: Wedding Value Proposition Banner */}
          <div className="pt-3 border-t border-[#E8EFEA] flex flex-wrap items-center justify-center sm:justify-between gap-2 text-xs text-gray-600 bg-white/60 p-3 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 text-[#1B3B2B] font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#5C8A70]" />
              <span>Khảo sát mặt bằng tận nơi 0đ trong 2 giờ</span>
            </div>
            <div className="flex items-center gap-2 text-[#1B3B2B] font-semibold">
              <CheckCircle className="w-4 h-4 text-[#C4685A]" />
              <span>Thi công kiên cố, chống mưa gió 100%</span>
            </div>
            <div className="text-gray-500 font-medium">
              ✨ Hợp đồng rõ ràng • Đúng giờ hoàng đạo
            </div>
          </div>
        </div>
      )}

      {/* TH3: GIỎ TRÁI CÂY & QUÀ TẶNG */}
      {activeCategory === 'fruits' && (
        <div className="space-y-4 animate-fade-in">
          {/* Row 1: Fruit Occasions Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {FRUIT_OCCASIONS.map((fo) => {
              const isActive = selectedFruitType === fo.id;
              return (
                <button
                  key={fo.id}
                  onClick={() => setSelectedFruitType(fo.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-[#1B3B2B] text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-[#F4F7F5] border border-[#D1DFD6]'
                  }`}
                >
                  <span>{fo.icon}</span>
                  <span>{fo.label}</span>
                </button>
              );
            })}
          </div>

          {/* Row 2: Fruit Value Proposition Banner */}
          <div className="pt-3 border-t border-[#E8EFEA] flex flex-wrap items-center justify-center sm:justify-between gap-2 text-xs text-gray-600 bg-white/60 p-3 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 text-[#1B3B2B] font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#5C8A70]" />
              <span>100% Trái cây nhập khẩu tem mác chính hãng</span>
            </div>
            <div className="flex items-center gap-2 text-[#1B3B2B] font-semibold">
              <CheckCircle className="w-4 h-4 text-[#C4685A]" />
              <span>Kết hoa tươi thủ công sang trọng theo yêu cầu</span>
            </div>
            <div className="text-gray-500 font-medium">
              🎁 Tặng kèm thiệp chúc mừng & ruy băng lụa cao cấp
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
