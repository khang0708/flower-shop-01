import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { openPersonalZaloChat } from '../services/zaloService';
import { openFacebookMessenger } from '../services/facebookService';
import { MessageCircle, X, Send, Sparkles, Clock, CheckCircle2, ChevronRight, PhoneCall } from 'lucide-react';

export const SocialChatHubFloatingButton = () => {
  const { shopZaloPhone, facebookSettings } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState('messenger'); // 'messenger' | 'zalo'

  const fbPageId = facebookSettings?.pageId || 'tiemhoaflorabloom';
  const fbPageName = facebookSettings?.pageName || 'Flora & Bloom - Tiệm Hoa Tươi';
  const isFbEnabled = facebookSettings?.isEnabled !== false;

  const handleOpenMessenger = (prefillText = '') => {
    openFacebookMessenger(fbPageId, prefillText);
  };

  const handleOpenZalo = (message = '') => {
    openPersonalZaloChat(shopZaloPhone, message);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end print:hidden">
      
      {/* KHUNG MINI POPUP CHAT ĐA KÊNH THÔNG MINH */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-88 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in text-[#222523] divide-y divide-gray-100">
          
          {/* HEADER CHỌN KÊNH: MESSENGER & ZALO */}
          <div className="p-3 bg-[#FAF8F5] flex items-center justify-between gap-2 border-b border-gray-100">
            <div className="flex items-center gap-1 bg-gray-200/70 p-1 rounded-2xl w-full">
              {/* Tab Messenger */}
              {isFbEnabled && (
                <button
                  type="button"
                  onClick={() => setActiveChannel('messenger')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeChannel === 'messenger'
                      ? 'bg-gradient-to-r from-[#0084FF] to-[#A824FF] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.13 2 11.23c0 2.9 1.45 5.49 3.73 7.14v3.52c0 .4.44.66.79.46l3.9-2.14c.51.08 1.04.12 1.58.12 5.52 0 10-4.13 10-9.23S17.52 2 12 2zm1.06 12.35l-2.61-2.79-5.1 2.79 5.61-5.96 2.68 2.79 5.03-2.79-5.61 5.96z"/>
                  </svg>
                  <span>Messenger</span>
                </button>
              )}

              {/* Tab Zalo */}
              <button
                type="button"
                onClick={() => setActiveChannel('zalo')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeChannel === 'zalo' || !isFbEnabled
                    ? 'bg-[#0068FF] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="font-extrabold text-xs">Z</span>
                <span>Zalo Tư Vấn</span>
              </button>
            </div>

            <button 
              onClick={() => setIsOpen(false)} 
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center text-xs transition-colors flex-shrink-0"
              title="Đóng khung chat"
            >
              ✕
            </button>
          </div>

          {/* NỘI DUNG KÊNH FACEBOOK MESSENGER */}
          {activeChannel === 'messenger' && isFbEnabled && (
            <div className="p-4 space-y-3.5 text-xs">
              {/* Fanpage Info Card */}
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50/70 via-purple-50/40 to-pink-50/40 rounded-2xl border border-blue-100/80">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0084FF] via-[#7B3FE4] to-[#A824FF] p-0.5 shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=150&q=80"
                      alt={fbPageName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h5 className="font-bold text-gray-900 text-xs truncate">{fbPageName}</h5>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  </div>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Thường phản hồi trong vài phút</span>
                  </p>
                </div>
              </div>

              {/* Gợi ý kịch bản 1-chạm (Quick Prompts) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Chọn nhanh chủ đề tư vấn:
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenMessenger('Chào Flora & Bloom, tôi muốn tư vấn mẫu hoa sinh nhật dưới 1 triệu!')}
                  className="w-full text-left p-2.5 rounded-xl bg-gray-50 hover:bg-purple-50/60 hover:text-purple-900 text-[11px] text-gray-700 transition-all flex items-center justify-between border border-transparent hover:border-purple-200"
                >
                  <span className="truncate">🎂 "Tư vấn mẫu hoa sinh nhật dưới 1 triệu"</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenMessenger('Chào tiệm, tôi cần đặt bó hoa giao gấp 60-90 phút tới Q.1/Bình Thạnh ạ!')}
                  className="w-full text-left p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50/60 hover:text-blue-900 text-[11px] text-gray-700 transition-all flex items-center justify-between border border-transparent hover:border-blue-200"
                >
                  <span className="truncate">⚡ "Cần đặt hoa giao hỏa tốc 60-90 phút"</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenMessenger('Chào shop, tôi muốn tra cứu tiến độ cắm hoa và duyệt ảnh mẫu hoa thực tế trước khi ship!')}
                  className="w-full text-left p-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50/60 hover:text-emerald-900 text-[11px] text-gray-700 transition-all flex items-center justify-between border border-transparent hover:border-emerald-200"
                >
                  <span className="truncate">🔍 "Tra cứu đơn hoa & Duyệt ảnh thực tế"</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                </button>
              </div>

              {/* Nút Mở Messenger Chính */}
              <button
                type="button"
                onClick={() => handleOpenMessenger('Chào Flora & Bloom, tôi muốn được tư vấn đặt hoa tươi!')}
                className="w-full bg-gradient-to-r from-[#0084FF] via-[#7B3FE4] to-[#A824FF] hover:opacity-95 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 text-xs"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.13 2 11.23c0 2.9 1.45 5.49 3.73 7.14v3.52c0 .4.44.66.79.46l3.9-2.14c.51.08 1.04.12 1.58.12 5.52 0 10-4.13 10-9.23S17.52 2 12 2zm1.06 12.35l-2.61-2.79-5.1 2.79 5.61-5.96 2.68 2.79 5.03-2.79-5.61 5.96z"/>
                </svg>
                <span>Mở Facebook Messenger (@{fbPageId})</span>
              </button>
            </div>
          )}

          {/* NỘI DUNG KÊNH ZALO CÁ NHÂN */}
          {(activeChannel === 'zalo' || !isFbEnabled) && (
            <div className="p-4 space-y-3.5 text-xs">
              <div className="flex items-center gap-3 p-3 bg-blue-50/70 rounded-2xl border border-blue-100">
                <div className="w-10 h-10 rounded-full bg-[#0068FF] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                  Z
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-gray-900 text-xs">Zalo Trực Tiếp Chủ Shop</h5>
                  <p className="text-[11px] text-blue-700 font-mono font-bold mt-0.5">
                    {shopZaloPhone} (07:00 - 22:30)
                  </p>
                </div>
              </div>

              <p className="text-gray-600 text-[11px] leading-relaxed">
                🌸 Nhắn tin qua Zalo để gửi ảnh hoa, chọn thiệp viết tay và gọi video call xem hoa thực tế tại xưởng.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenZalo('Chào shop, tôi muốn được tư vấn đặt hoa tươi!')}
                  className="bg-[#0068FF] hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Mở Zalo Chat</span>
                </button>

                <a
                  href={`tel:${shopZaloPhone.replace(/\s+/g, '')}`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 text-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Gọi Hotline</span>
                </a>
              </div>
            </div>
          )}

          {/* FOOTER CAM KẾT */}
          <div className="px-4 py-2.5 bg-[#FAF8F5] text-[10px] text-gray-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-600" /> Phục vụ 24/7
            </span>
            <span>Flora & Bloom Atelier</span>
          </div>

        </div>
      )}

      {/* NÚT CHÍNH FLOATING BẬT TẮT HUB */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-2xl hover:shadow-3xl flex items-center justify-center transition-all duration-300 active:scale-90 relative group border-2 border-white bg-gradient-to-tr from-[#0084FF] via-[#7B3FE4] to-[#A824FF] text-white"
        title="Chat tư vấn qua Messenger & Zalo"
        aria-label="Mở khung chat tư vấn hoa tươi Messenger và Zalo"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            {/* Icon Messenger */}
            <svg className="w-6 h-6 fill-current drop-shadow-sm" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.13 2 11.23c0 2.9 1.45 5.49 3.73 7.14v3.52c0 .4.44.66.79.46l3.9-2.14c.51.08 1.04.12 1.58.12 5.52 0 10-4.13 10-9.23S17.52 2 12 2zm1.06 12.35l-2.61-2.79-5.1 2.79 5.61-5.96 2.68 2.79 5.03-2.79-5.61 5.96z"/>
            </svg>

            {/* Badge Zalo góc dưới */}
            <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-[#0068FF] text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white shadow-xs">
              Z
            </span>

            {/* Online Green Pulse */}
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </span>
          </>
        )}
      </button>

    </div>
  );
};
