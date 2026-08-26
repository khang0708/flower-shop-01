import React from 'react';
import { useShop } from '../context/ShopContext';
import { OCCASIONS, COLOR_TONES } from '../data/flowers';
import { Sparkles, Palette } from 'lucide-react';

export const OccasionFilter = () => {
  const { 
    selectedOccasion, 
    setSelectedOccasion, 
    selectedColor, 
    setSelectedColor 
  } = useShop();

  return (
    <div id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Tiêu đề & Dịp Tặng Hoa */}
      <div className="text-center mb-8">
        <h2 className="font-serif text-3xl sm:text-4xl text-[#1B3B2B] font-bold">
          Bộ Sưu Tập Hoa Tươi Nghệ Thuật
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-md mx-auto">
          Chọn mẫu hoa phù hợp với cảm xúc và thông điệp bạn muốn gửi trao
        </p>
      </div>

      {/* Row 1: Dịp Tặng Hoa (Occasions Tabs) */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 scrollbar-none">
        {OCCASIONS.map((occ) => {
          const isActive = selectedOccasion === occ.id;
          return (
            <button
              key={occ.id}
              onClick={() => setSelectedOccasion(occ.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 active:scale-95 ${
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

      {/* Row 2: Bộ Lọc Màu Sắc (Color Tone Filter) */}
      <div className="mt-4 pt-4 border-t border-[#E8EFEA] flex flex-wrap items-center justify-between gap-4">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                  isColorActive
                    ? 'border-[#1B3B2B] bg-[#1B3B2B] text-white font-semibold shadow-sm'
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
  );
};
