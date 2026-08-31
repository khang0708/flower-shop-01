import React from 'react';
import { useShop } from '../context/ShopContext';
import { Sparkles, ShieldCheck, Clock, ArrowRight, HeartHandshake } from 'lucide-react';

export const HeroSection = () => {
  const { setIsAIFloristOpen, setSelectedOccasion } = useShop();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-[#F4F7F5] to-[#FAF8F5] py-12 md:py-16">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#F5D6CE]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-[#D1DFD6]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* CỘT TRÁI: TEXT & STORYTELLING */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2 bg-white/90 border border-[#D1DFD6] px-3.5 py-1.5 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#5C8A70] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#1B3B2B] uppercase tracking-wider">
                Mùa Hoa Thu Mộng Mơ • Nhập Mới Mỗi Sáng 05:00
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1B3B2B] leading-[1.12] tracking-tight">
              Gửi gắm yêu thương qua từng <span className="italic text-[#C4685A] font-normal">cánh hoa nghệ thuật</span>
            </h1>

            <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans font-light">
              Mỗi bó hoa tại <strong>Flora & Bloom</strong> là một tác phẩm thủ công độc bản. Chúng tôi cam kết chụp ảnh duyệt trước khi giao, miễn phí thiệp in nghệ thuật và giao hỏa tốc chỉ từ 60 phút.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <a
                href="#catalog"
                onClick={() => setSelectedOccasion('all')}
                className="bg-[#1B3B2B] hover:bg-[#264A37] text-white text-xs sm:text-sm font-semibold px-6 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
              >
                <span>Xem Mẫu Hoa Tươi Hôm Nay</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={() => setIsAIFloristOpen(true)}
                className="bg-white hover:bg-[#FAF4F0] text-[#1B3B2B] border border-[#E8998D] text-xs sm:text-sm font-semibold px-5 py-3.5 rounded-full shadow-sm transition-all flex items-center gap-2 active:scale-95 group"
              >
                <Sparkles className="w-4 h-4 text-[#C4685A] group-hover:rotate-12 transition-transform" />
                <span>Thẩm Định Ảnh Mẫu Với AI</span>
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#E8EFEA] text-left">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EBF2ED] text-[#1B3B2B] flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1B3B2B]">Giao Đúng Khung Giờ</h4>
                  <p className="text-[11px] text-gray-500">Chuẩn xác từng phút hẹn</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FDF0ED] text-[#C4685A] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1B3B2B]">Duyệt Ảnh Trước Khi Giao</h4>
                  <p className="text-[11px] text-gray-500">Đúng mẫu 100%</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EBF2ED] text-[#5C8A70] flex items-center justify-center flex-shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1B3B2B]">Bảo Hành Tươi $\ge 3$ Ngày</h4>
                  <p className="text-[11px] text-gray-500">Đổi mới nếu hoa héo dập</p>
                </div>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI: VISUAL SHOWCASE NGHỆ THUẬT */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md">
              
              {/* Main Image Frame 4:5 */}
              <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80"
                  alt="Bó hoa nghệ thuật Juliet Nắng Ban Mai - Flora & Bloom"
                  width="400"
                  height="500"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-200">
                    Mẫu Hoa Nổi Bật Tuần Này
                  </span>
                  <h3 className="font-serif text-2xl font-bold">Juliet Nắng Ban Mai</h3>
                  <p className="text-xs text-gray-200 mt-1">Phối từ 18 cành hoa hồng Juliet nhập khẩu</p>
                </div>
              </div>

              {/* Floating Badge 1: Thợ cắm hoa trực tiếp */}
              <div className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-[#E8EFEA] flex items-center gap-3 animate-fade-in">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                  alt="Nghệ nhân cắm hoa Minh Thư"
                  width="40"
                  height="40"
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-10 rounded-full object-cover border border-[#1B3B2B]"
                />
                <div>
                  <span className="text-[10px] text-gray-500 block">Nghệ nhân phụ trách</span>
                  <span className="text-xs font-bold text-[#1B3B2B]">Thợ cắm hoa Minh Thư</span>
                </div>
              </div>

              {/* Floating Badge 2: Đánh giá 5 sao */}
              <div className="absolute top-6 -right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-[#E8EFEA] flex items-center gap-1.5">
                <span className="text-amber-400 text-sm">★★★★★</span>
                <span className="text-xs font-bold text-[#1B3B2B]">4.9/5.0 (650+ đánh giá)</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
