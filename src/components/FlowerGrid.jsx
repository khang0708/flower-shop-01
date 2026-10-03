import React, { useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { FlowerCard } from './FlowerCard';
import { 
  Sparkles, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Star, 
  Clock, 
  Tag,
  ChevronDown
} from 'lucide-react';
import { openPersonalZaloChat } from '../services/zaloService';

export const FlowerGrid = () => {
  const { 
    products, 
    activeCategory,
    selectedOccasion, 
    selectedColor, 
    selectedWeddingType,
    selectedFruitType,
    searchQuery, 
    sortBy, 
    setSortBy, 
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
    const filtered = products.filter((item) => {
      if (item.isAvailable === false) return false;

      const itemCategory = item.category || 'flowers';

      // 1.1 Lọc theo Pillar Category
      if (itemCategory !== activeCategory) {
        return false;
      }

      // 1.2 Lọc Sub-filters theo Category
      if (activeCategory === 'flowers') {
        if (selectedOccasion !== 'all' && item.occasion !== selectedOccasion) {
          return false;
        }
        if (selectedColor !== 'all' && item.colorTone !== selectedColor) {
          return false;
        }
      } else if (activeCategory === 'weddings') {
        if (selectedWeddingType !== 'all' && item.weddingType !== selectedWeddingType) {
          return false;
        }
      } else if (activeCategory === 'fruits') {
        if (selectedFruitType !== 'all' && item.fruitOccasion !== selectedFruitType) {
          return false;
        }
      }

      // 1.3 Lọc Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchSubtitle = item.subtitle?.toLowerCase().includes(q);
        const matchFlowers = item.flowerTypes?.some(f => f.toLowerCase().includes(q));
        const matchFruits = item.fruitTypes?.some(f => f.toLowerCase().includes(q));
        const matchIncluded = item.includedItems?.some(i => i.toLowerCase().includes(q));
        if (!matchName && !matchSubtitle && !matchFlowers && !matchFruits && !matchIncluded) {
          return false;
        }
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
  }, [products, activeCategory, selectedOccasion, selectedColor, selectedWeddingType, selectedFruitType, searchQuery, sortBy]);

  // Nhãn hiển thị số lượng theo category
  const counterLabel = useMemo(() => {
    switch (activeCategory) {
      case 'weddings':
        return `🧧 ${filteredAndSortedFlowers.length} bộ tráp cưới hỏi thủ công`;
      case 'fruits':
        return `🍇 ${filteredAndSortedFlowers.length} mẫu giỏ trái cây cao cấp`;
      case 'flowers':
      default:
        return `🌸 ${filteredAndSortedFlowers.length} mẫu hoa tuyển chọn`;
    }
  }, [activeCategory, filteredAndSortedFlowers.length]);

  return (
    <section className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pb-16">
      
      {/* THANH CÔNG CỤ ĐIỀU KHIỂN & SẮP XẾP SẢN PHẨM */}
      <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E8EFEA] shadow-xs mb-3 sm:mb-6 flex flex-row items-center justify-between gap-2">
        
        {/* Số lượng sản phẩm */}
        <div className="flex items-center">
          <span className="text-xs font-bold text-[#1B3B2B] bg-[#F4F7F5] px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl border border-[#D1DFD6]">
            {counterLabel}
          </span>
        </div>

        {/* BỘ SẮP XẾP SẢN PHẨM (SORTING) */}
        <div className="flex items-center gap-2">
          {/* Mobile Sort Dropdown: Gọn gàng trên cùng 1 dòng, không đẩy sản phẩm xuống */}
          <div className="relative md:hidden flex items-center bg-[#FAF8F5] border border-gray-200 rounded-xl px-2.5 py-1 shadow-2xs">
            <ArrowUpDown className="w-3 h-3 text-[#5C8A70] mr-1 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sắp xếp sản phẩm"
              className="bg-transparent text-xs font-semibold text-[#1B3B2B] focus:outline-none pr-4 appearance-none cursor-pointer py-0.5"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-gray-500 absolute right-1.5 pointer-events-none" />
          </div>

          {/* Desktop Sort Segmented Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mr-1 flex-shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#5C8A70]" />
              <span>Sắp xếp:</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-2xl border border-gray-200">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSortBy(opt.id)}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
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

      </div>

      {/* Grid danh sách sản phẩm: 2 cột trên mobile, 2 cột tablet, 3 cột desktop */}
      {filteredAndSortedFlowers.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8 animate-fade-in">
          {filteredAndSortedFlowers.map((flower) => (
            <FlowerCard key={flower.id} flower={flower} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#D1DFD6] p-8">
          <p className="text-3xl mb-2">
            {activeCategory === 'weddings' ? '🎪' : activeCategory === 'fruits' ? '🍇' : '🌸'}
          </p>
          <h3 className="font-serif text-lg font-bold text-[#1B3B2B]">
            {activeCategory === 'weddings' 
              ? 'Không tìm thấy gói cưới hỏi phù hợp với bộ lọc'
              : activeCategory === 'fruits'
              ? 'Không tìm thấy giỏ trái cây phù hợp với bộ lọc'
              : 'Không tìm thấy mẫu hoa phù hợp với bộ lọc'}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {activeCategory === 'weddings'
              ? 'Ngọc Flower nhận kết tráp cưới hỏi rồng phụng theo yêu cầu riêng. Nhắn Zalo để được nghệ nhân tư vấn miễn phí!'
              : activeCategory === 'fruits'
              ? 'Bạn có thể yêu cầu mix trái cây theo sở thích và ngân sách riêng từ 500k. Đội ngũ nghệ nhân sẽ chụp ảnh duyệt trước khi giao!'
              : 'Bạn có thể thử chọn lại dịp tặng khác hoặc nhắn tin Zalo để nghệ nhân cắm hoa thiết kế riêng theo ngân sách của bạn.'}
          </p>
          <button
            type="button"
            onClick={() => openPersonalZaloChat(
              shopZaloPhone, 
              activeCategory === 'weddings'
                ? 'Chào shop Ngọc Flower, tôi muốn được tư vấn và báo giá gói tráp cưới hỏi!'
                : activeCategory === 'fruits'
                ? 'Chào shop Ngọc Flower, tôi muốn đặt mix giỏ trái cây theo ngân sách và hoa tươi riêng!'
                : 'Chào shop Ngọc Flower, tôi muốn được tư vấn cắm hoa theo yêu cầu riêng!'
            )}
            className="mt-4 bg-[#1B3B2B] text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-[#264A37] transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            💬 Nhắn Zalo tư vấn riêng ngay
          </button>
        </div>
      )}

      {/* Banner Cam kết & Tư Vấn Riêng */}
      <div className="mt-16 bg-[#F4F7F5] rounded-3xl p-8 border border-[#D1DFD6] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold text-[#5C8A70] uppercase tracking-wider">
            {activeCategory === 'weddings' ? 'Tráp Cưới Nghệ Thuật' : activeCategory === 'fruits' ? 'Giỏ Trái Cây Nghệ Thuật' : 'Ngọc Flower Quality'}
          </span>
          <h3 className="font-serif text-2xl text-[#1B3B2B] font-bold">
            {activeCategory === 'weddings'
              ? 'Bạn cần tư vấn đặt bộ tráp cưới hỏi?'
              : activeCategory === 'fruits'
              ? 'Bạn cần thiết kế giỏ trái cây quà biếu theo yêu cầu?'
              : 'Bạn cần cắm hoa theo ngân sách riêng?'}
          </h3>
          <p className="text-xs text-gray-600 max-w-lg">
            {activeCategory === 'weddings'
              ? 'Đội ngũ nghệ nhân của Ngọc Flower tư vấn mẫu tráp rồng phụng, tráp sơn mài, cau bắp, quả nhập khẩu kết hoa tươi và sính lễ chu đáo hoàn toàn miễn phí.'
              : activeCategory === 'fruits'
              ? 'Lựa chọn từng loại quả nhập khẩu cao cấp (Nho Mẫu Đơn, Táo Envy, Cherry đỏ, Kiwi vàng...) phối cùng hoa tươi nghệ thuật, in thiệp và ruy băng miễn phí.'
              : 'Đội ngũ nghệ nhân của chúng tôi nhận thiết kế hoa tiệc cưới, hoa sự kiện doanh nghiệp và cắm hoa theo yêu cầu tone màu riêng từ 500.000đ.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openPersonalZaloChat(
              shopZaloPhone, 
              activeCategory === 'weddings'
                ? 'Chào shop Ngọc Flower, tôi cần tư vấn bộ tráp cưới hỏi và nhận báo giá chi tiết!'
                : activeCategory === 'fruits'
                ? 'Chào shop Ngọc Flower, tôi muốn nhận báo giá giỏ trái cây quà tặng theo ngân sách!'
                : 'Chào nghệ nhân Ngọc Flower, tôi muốn tư vấn thiết kế mẫu hoa theo ngân sách riêng!'
            )}
            className="bg-[#0068FF] text-white text-xs font-bold px-5 py-3 rounded-full hover:bg-blue-600 transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>💬 Chat Zalo Nhận Báo Giá ({shopZaloPhone})</span>
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


