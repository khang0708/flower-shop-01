import React from 'react';
import { useShop } from '../context/ShopContext';
import { openPersonalZaloChat } from '../services/zaloService';
import { Phone, MapPin, ShieldCheck, Heart, Globe, MessageCircle, Lock } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { ZaloIcon } from './ZaloIcon';

export const Footer = ({ onOpenAdminLogin }) => {
  const { shopZaloPhone, shopAddress } = useShop();
  return (
    <footer className="bg-[#1B3B2B] text-[#FAF8F5] pt-16 pb-10 border-t border-[#264A37]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          
          {/* Cột 1: Brand Info */}
          <div className="space-y-4">
            <BrandLogo variant="horizontal" size="lg" theme="light" />
            <p className="text-xs text-gray-300 leading-relaxed font-light">
              Tiệm hoa tươi thủ công cao cấp. Chúng tôi chăm chút từng cành hoa, từng dòng chữ trên thiệp để món quà của bạn trở thành khoảnh khắc đáng nhớ nhất.
            </p>
            <div className="flex gap-3 text-white/80">
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#E8998D] hover:text-white flex items-center justify-center transition-all" title="Instagram">
                <Globe className="w-4 h-4" />
              </a>
              <button 
                type="button"
                onClick={() => openPersonalZaloChat(shopZaloPhone, 'Chào shop Ngọc Flower, tôi muốn tư vấn mẫu hoa!')}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#0068FF] hover:text-white flex items-center justify-center transition-all" 
                title={`Chat Zalo (${shopZaloPhone})`}
              >
                <ZaloIcon className="w-4 h-4" variant="white" />
              </button>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#E8998D] hover:text-white flex items-center justify-center transition-all" title="Hotline">
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Cột 2: Dịp tặng hoa */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-bold text-white">Bộ Sưu Tập Theo Dịp</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li><a href="#" className="hover:text-[#E8998D] transition-colors">💐 Hoa Sinh Nhật Sang Trọng</a></li>
              <li><a href="#" className="hover:text-[#E8998D] transition-colors">💖 Hoa Kỷ Niệm & Tỏ Tình</a></li>
              <li><a href="#" className="hover:text-[#E8998D] transition-colors">🏢 Kệ Hoa Khai Trương Tài Lộc</a></li>
              <li><a href="#" className="hover:text-[#E8998D] transition-colors">💍 Hoa Cưới Cầm Tay Cô Dâu</a></li>
              <li><a href="#" className="hover:text-[#E8998D] transition-colors">🕊️ Hoa Tri Ân & Thăm Hỏi</a></li>
            </ul>
          </div>

          {/* Cột 3: Cam kết của Ngọc Flower */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-bold text-white">Chính Sách & Cam Kết</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li><a href="#" className="hover:text-[#E8998D] transition-colors">📸 Cam kết chụp ảnh hoa trước khi giao</a></li>
              <li><a href="#" className="hover:text-[#E8998D] transition-colors">🌿 Bảo hành hoa tươi từ 3 - 5 ngày</a></li>
              <li><a href="#" className="hover:text-[#E8998D] transition-colors">⚡ Giao hỏa tốc 60 - 90 phút nội thành</a></li>
              <li><a href="#" className="hover:text-[#E8998D] transition-colors">🕵️ Chính sách giao hoa ẩn danh người gửi</a></li>
              <li><a href="#" className="hover:text-[#E8998D] transition-colors">💌 Hướng dẫn chăm sóc hoa tươi lâu</a></li>
            </ul>
          </div>

          {/* Cột 4: Hệ thống cửa hàng */}
          <div className="space-y-3 text-xs text-gray-300">
            <h4 className="font-serif text-base font-bold text-white">Xưởng Hoa & Liên Hệ</h4>
            <div className="space-y-2">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#E8998D] flex-shrink-0 mt-0.5" />
                <span>{shopAddress || '44 Đỗ Nhuận, Phường Buôn Ma Thuột, Đắk Lắk'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#E8998D] flex-shrink-0" />
                <a href={`tel:${shopZaloPhone.replace(/\s+/g, '')}`} className="font-bold text-white hover:text-[#E8998D] transition-colors">
                  Hotline/Zalo: {shopZaloPhone} (07:00 - 22:00)
                </a>
              </p>
              <p className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#0068FF] flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => openPersonalZaloChat(shopZaloPhone, 'Chào shop, tôi muốn được tư vấn đặt hoa tươi!')}
                  className="text-gray-300 hover:text-white transition-colors underline flex items-center gap-1 text-[11px]"
                >
                  Chat Zalo Cá Nhân Xưởng Hoa
                </button>
              </p>
            </div>
          </div>

        </div>

        {/* Sub-footer kín đáo dành riêng cho nhân viên */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-3">
          <p>© 2026 Ngọc Flower. All rights reserved.</p>
          
          <div className="flex items-center gap-4">
            <p className="flex items-center gap-1">
              Thiết kế theo chuẩn <strong>UI/UX Pro Max</strong> <Heart className="w-3 h-3 text-[#E8998D] fill-[#E8998D]" />
            </p>
            <span className="text-white/20">•</span>
            {/* Link kín đáo ở chân trang */}
            <button
              onClick={onOpenAdminLogin}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
              title="Đăng nhập dành cho nhân viên & nghệ nhân"
            >
              <Lock className="w-3 h-3" />
              <span>Cổng Nội Bộ</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
