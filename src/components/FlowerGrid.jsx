import React, { useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { FlowerCard } from './FlowerCard';
import { 
  Sparkles, 
  ArrowUpDown, 
  SlidersHorizontal, 
  ArrowUp, 
  ArrowDown, 
  Star, 
  Clock, 
  Tag
} from 'lucide-react';

import { openPersonalZaloChat } from '../services/zaloService';

export const FlowerGrid = () => {
  const { 
    products, 
    selectedOccasion, 
    selectedColor, 
    searchQuery, 
    sortBy, 
    setSortBy, 
    setIsAIFloristOpen,
    shopZaloPhone
  } = useShop();

  const SORT_OPTIONS = [
    { id: 'featured', label: 'Nổi Bật Nhất', icon: Sparkles },
    { id: 'price_asc', label: 'Giá: Thấp → Cao', icon: ArrowUp },
    { id: 'price_desc', label: 'Giá: Cao → Thấp', icon: ArrowDown },
    { id: 'rating_desc', label: 'Đánh Giá Cao', icon: Star },
    { id: 'newest', label: 'Mới Ra Mắt', icon: Clock },
    { id: 'name_asc', label: 'Tên: A → Z', icon: Tag },
  ];

  // Lọc và sắp xếp sản phẩm theo tiêu chí được chọn
  const filteredAndSortedFlowers = useMemo(() => {
    // 1. Lọc sản phẩm
    const filtered = products.filter((flower) => {
      if (flower.isAvailable === false) return false;

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

    // 2. Sắp xếp sản phẩm (Sorting)
    const cloned = [...filtered];
    switch (sortBy) {
      case 'price_asc':
        return cloned.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      case 'price_desc':
        return cloned.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      case 'rating_desc':
        return cloned.sort((a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5) || (Number(b.reviewsCount) || 0) - (Number(a.reviewsCount) || 0));
      case 'newest':
        return cloned.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      case 'name_asc':
        return cloned.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
      case 'featured':
      default:
        return cloned;
    }
  }, [products, selectedOccasion, selectedColor, searchQuery, sortBy]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      
      {/* THANH CÔNG CỤ ĐIỀU KHIỂN & SẮP XẾP SẢN PHẨM */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8EFEA] shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Số lượng sản phẩm & AI prompt */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-[#1B3B2B] bg-[#F4F7F5] px-3 py-1.5 rounded-xl border border-[#D1DFD6]">
            🌸 <strong>{filteredAndSortedFlowers.length}</strong> mẫu hoa tuyển chọn
          </span>

          <button
            onClick={() => setIsAIFloristOpen(true)}
            className="text-xs text-[#C4685A] hover:text-[#a85245] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Thử tính năng AI Florist nhận diện hoa</span>
          </button>
        </div>

        {/* BỘ SẮP XẾP SẢN PHẨM (SORTING BAR) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mr-1 flex-shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#5C8A70]" />
            <span className="hidden sm:inline">Sắp xếp:</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-2xl border border-gray-200">
            {SORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = sortBy === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    isActive
                      ? 'bg-[#1B3B2B] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${isActive ? 'text-[#F5D6CE]' : 'text-gray-400'}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Grid danh sách sản phẩm */}
      {filteredAndSortedFlowers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-fade-in">
          {filteredAndSortedFlowers.map((flower) => (
            <FlowerCard key={flower.id} flower={flower} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#D1DFD6] p-8">
          <p className="text-3xl mb-2">🌸</p>
          <h3 className="font-serif text-lg font-bold text-[#1B3B2B]">
            Không tìm thấy mẫu hoa phù hợp với bộ lọc
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Bạn có thể thử chọn lại dịp tặng khác hoặc tải ảnh mẫu hoa bạn thích để chúng tôi cắm riêng theo yêu cầu.
          </p>
          <button
            onClick={() => setIsAIFloristOpen(true)}
            className="mt-4 bg-[#1B3B2B] text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-[#264A37] transition-all shadow-sm"
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
          <button
            type="button"
            onClick={() => openPersonalZaloChat(shopZaloPhone, 'Chào nghệ nhân Flora & Bloom, tôi muốn tư vấn thiết kế mẫu hoa theo ngân sách riêng!')}
            className="bg-[#0068FF] text-white text-xs font-bold px-5 py-3 rounded-full hover:bg-blue-600 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <span>💬 Chat Zalo Với Nghệ Nhân ({shopZaloPhone})</span>
          </button>
          <a
            href={`tel:${shopZaloPhone.replace(/\s+/g, '')}`}
            className="bg-white text-[#1B3B2B] border border-[#D1DFD6] text-xs font-bold px-5 py-3 rounded-full hover:bg-gray-50 transition-all active:scale-95"
          >
            📞 Gọi {shopZaloPhone}
          </a>
        </div>
      </div>

    </section>
  );
};

