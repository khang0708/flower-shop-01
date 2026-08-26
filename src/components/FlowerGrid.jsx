import React from 'react';
import { useShop } from '../context/ShopContext';
import { FlowerCard } from './FlowerCard';
import { Sparkles } from 'lucide-react';

export const FlowerGrid = () => {
  const { products, selectedOccasion, selectedColor, searchQuery, setIsAIFloristOpen } = useShop();

  const filteredFlowers = products.filter((flower) => {
    // Filter Occasion
    if (selectedOccasion !== 'all' && flower.occasion !== selectedOccasion) {
      return false;
    }
    // Filter Color Tone
    if (selectedColor !== 'all' && flower.colorTone !== selectedColor) {
      return false;
    }
    // Filter Search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = flower.name?.toLowerCase().includes(q);
      const matchSubtitle = flower.subtitle?.toLowerCase().includes(q);
      const matchFlowers = flower.flowerTypes?.some(f => f.toLowerCase().includes(q));
      if (!matchName && !matchSubtitle && !matchFlowers) return false;
    }
    return true;
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      
      {/* Kết quả đếm */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs text-gray-500">
          Hiển thị <strong>{filteredFlowers.length}</strong> mẫu hoa tươi tuyển chọn
        </span>
        <button
          onClick={() => setIsAIFloristOpen(true)}
          className="text-xs text-[#C4685A] hover:underline font-semibold flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          <span>Không tìm thấy mẫu ưng ý? Hãy để AI thẩm định ảnh của bạn</span>
        </button>
      </div>

      {/* Grid sản phẩm */}
      {filteredFlowers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredFlowers.map((flower) => (
            <FlowerCard key={flower.id} flower={flower} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#D1DFD6] p-8">
          <p className="text-3xl mb-2">🌸</p>
          <h3 className="font-serif text-lg font-bold text-[#1B3B2B]">
            Không tìm thấy mẫu hoa phù hợp với bộ lọc
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Bạn có thể thử chọn lại dịp tặng khác hoặc tải ảnh mẫu hoa bạn thích để chúng tôi cắm riêng theo yêu cầu.
          </p>
          <button
            onClick={() => setIsAIFloristOpen(true)}
            className="mt-4 bg-[#1B3B2B] text-white text-xs font-semibold px-5 py-2.5 rounded-full"
          >
            Tải ảnh hoa theo yêu cầu
          </button>
        </div>
      )}

      {/* Banner Cam kết & Quy chuẩn Nghệ nhân */}
      <div className="mt-16 bg-[#F4F7F5] rounded-3xl p-8 border border-[#D1DFD6] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold text-[#5C8A70] uppercase tracking-wider">
            Flora & Bloom Atelier Quality
          </span>
          <h3 className="font-serif text-2xl text-[#1B3B2B] font-bold">
            Bạn cần cắm hoa theo ngân sách riêng?
          </h3>
          <p className="text-xs text-gray-600 max-w-lg">
            Đội ngũ nghệ nhân của chúng tôi nhận thiết kế hoa tiệc cưới, hoa sự kiện doanh nghiệp và cắm hoa theo yêu cầu tone màu riêng từ 500.000đ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://zalo.me"
            target="_blank"
            rel="noreferrer"
            className="bg-[#0068FF] text-white text-xs font-bold px-5 py-3 rounded-full hover:bg-blue-600 transition-all shadow-sm"
          >
            💬 Chat Zalo Với Nghệ Nhân
          </a>
          <a
            href="tel:1900888999"
            className="bg-white text-[#1B3B2B] border border-[#D1DFD6] text-xs font-bold px-5 py-3 rounded-full hover:bg-gray-50 transition-all"
          >
            📞 Gọi 1900 888 999
          </a>
        </div>
      </div>

    </section>
  );
};
