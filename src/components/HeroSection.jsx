import { ShieldCheck, Clock, ArrowRight, HeartHandshake, MessageCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { openPersonalZaloChat } from '../services/zaloService';
import { useShop } from '../context/ShopContext';
import { SHOP_CATEGORIES } from '../data/flowers';

export const HeroSection = () => {
  const { activeCategory, setActiveCategory, shopZaloPhone } = useShop();

  const handleSelectPillar = (categoryId) => {
    setActiveCategory(categoryId);
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-[#F4F7F5] to-[#FAF8F5] py-10 md:py-16">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#F5D6CE]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-[#D1DFD6]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* CỘT TRÁI: TEXT & STORYTELLING */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2 bg-white/95 border border-[#D1DFD6] px-3.5 py-1.5 rounded-full shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#5C8A70] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#1B3B2B] uppercase tracking-wider">
                Tiệm Hoa Tươi • Rạp Cưới Hỏi & Gia Tiên • Giỏ Trái Cây Nhập Khẩu
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-[#1B3B2B] leading-[1.15] tracking-tight">
              Trọn vẹn mọi khoảnh khắc với <span className="italic text-[#C4685A] font-normal">hoa nghệ thuật & cưới hỏi trọn gói</span>
            </h1>

            <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans font-light">
              <strong>Ngọc Flower</strong> cung cấp hoa tươi thiết kế thủ công độc bản, dịch vụ thi công rạp cưới hỏi & bàn thờ gia tiên khảo sát tận nơi 0đ, cùng giỏ trái cây nhập khẩu cao cấp kết hoa tươi trao trọn tình cảm.
            </p>

            {/* 3 Trụ cột danh mục nhanh (Interactive Pillar Selector) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-left">
              {SHOP_CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectPillar(cat.id)}
                    className={`p-3 rounded-2xl border text-left transition-all duration-300 relative group cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-[#1B3B2B] text-white border-[#1B3B2B] shadow-md ring-2 ring-[#1B3B2B]/20'
                        : 'bg-white/90 text-gray-800 border-[#D1DFD6] hover:border-[#1B3B2B] hover:bg-white shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{cat.icon}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#EBF2ED] text-[#1B3B2B]'
                      }`}>
                        {cat.badge}
                      </span>
                    </div>
                    <div className="font-bold text-xs tracking-tight">{cat.shortName}</div>
                    <div className={`text-[10px] mt-0.5 line-clamp-1 ${
                      isSelected ? 'text-gray-200' : 'text-gray-500'
                    }`}>
                      {cat.tagline}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <a
                href="#catalog"
                className="bg-[#1B3B2B] hover:bg-[#264A37] text-white text-xs sm:text-sm font-semibold px-6 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
              >
                <span>Xem Sản Phẩm & Dịch Vụ</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => openPersonalZaloChat(shopZaloPhone, 'Chào shop Ngọc Flower, tôi muốn nhận báo giá dịch vụ (Hoa tươi / Rạp cưới / Giỏ trái cây)!')}
                className="bg-white hover:bg-[#FAF4F0] text-[#1B3B2B] border border-[#D1DFD6] hover:border-[#1B3B2B] text-xs sm:text-sm font-semibold px-5 py-3.5 rounded-full shadow-xs transition-all flex items-center gap-2 active:scale-95 group"
              >
                <MessageCircle className="w-4 h-4 text-[#0068FF]" />
                <span>Nhận Báo Giá Nhanh Qua Zalo</span>
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 pt-4 border-t border-[#E8EFEA] text-left">
              <div className="flex items-center sm:items-start gap-3 bg-white/60 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border sm:border-0 border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#EBF2ED] text-[#1B3B2B] flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1B3B2B]">Giao Nhanh & Đúng Giờ</h4>
                  <p className="text-[11px] text-gray-500">Hoa tươi 60p • Rạp cưới đúng hẹn</p>
                </div>
              </div>

              <div className="flex items-center sm:items-start gap-3 bg-white/60 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border sm:border-0 border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#FDF0ED] text-[#C4685A] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1B3B2B]">Duyệt Ảnh & Khảo Sát 0đ</h4>
                  <p className="text-[11px] text-gray-500">Khảo sát rạp tận nơi miễn phí</p>
                </div>
              </div>

              <div className="flex items-center sm:items-start gap-3 bg-white/60 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border sm:border-0 border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#EBF2ED] text-[#5C8A70] flex items-center justify-center flex-shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1B3B2B]">Cam Kết Uy Tín 100%</h4>
                  <p className="text-[11px] text-gray-500">Trái cây nhập chuẩn • Hoa tươi lâu</p>
                </div>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI: VISUAL SHOWCASE NGHỆ THUẬT */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md">
              
              {/* Dynamic Image Frame Based on Active Category */}
              <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src={
                    activeCategory === 'weddings'
                      ? '/products/rap_cuoi_versailles.jpg'
                      : activeCategory === 'fruits'
                      ? '/products/gio_trai_cay_phu_quy.jpg'
                      : 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={
                    activeCategory === 'weddings'
                      ? 'Rạp cưới hỏi cao cấp Ngọc Flower'
                      : activeCategory === 'fruits'
                      ? 'Giỏ trái cây nhập khẩu kết hoa tươi Ngọc Flower'
                      : 'Bó hoa nghệ thuật Juliet Nắng Ban Mai - Ngọc Flower'
                  }
                  width="400"
                  height="500"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-200">
                    {activeCategory === 'weddings' ? 'Gói Cưới Hỏi Nổi Bật' : activeCategory === 'fruits' ? 'Giỏ Trái Cây Thượng Hạng' : 'Mẫu Hoa Nổi Bật Tuần Này'}
                  </span>
                  <h3 className="font-serif text-2xl font-bold">
                    {activeCategory === 'weddings' ? 'Rạp Cưới Versailles Hoàng Gia' : activeCategory === 'fruits' ? 'Giỏ Phú Quý Đại Cát' : 'Juliet Nắng Ban Mai'}
                  </h3>
                  <p className="text-xs text-gray-200 mt-1">
                    {activeCategory === 'weddings' ? 'Khảo sát không gian tận nơi miễn phí 100%' : activeCategory === 'fruits' ? '100% Trái cây nhập khẩu phối hoa Juliet tươi' : 'Phối từ 18 cành hoa hồng Juliet nhập khẩu'}
                  </p>
                </div>
              </div>

              {/* Floating Badge 1: Thợ cắm hoa / Đội ngũ thi công */}
              <div className="absolute -bottom-4 left-2 sm:-left-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-[#E8EFEA] flex items-center gap-3 animate-fade-in z-10">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                  alt="Nghệ nhân Ngọc Flower"
                  width="40"
                  height="40"
                  loading="lazy"
                  decoding="async"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-[#1B3B2B]"
                />
                <div>
                  <span className="text-[10px] text-gray-500 block leading-tight">Đội ngũ chuyên nghiệp</span>
                  <span className="text-xs font-bold text-[#1B3B2B]">Nghệ nhân Ngọc Flower</span>
                </div>
              </div>

              {/* Floating Badge 2: Đánh giá 5 sao */}
              <div className="absolute top-4 right-2 sm:-right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-[#E8EFEA] flex items-center gap-1.5 z-10">
                <span className="text-amber-400 text-xs sm:text-sm">★★★★★</span>
                <span className="text-[11px] sm:text-xs font-bold text-[#1B3B2B]">4.9/5.0 (850+ khách tin chọn)</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
