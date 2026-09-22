import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { openPersonalZaloChat } from '../services/zaloService';
import { openFacebookMessenger } from '../services/facebookService';
import { PhoneCall, Check, Phone } from 'lucide-react';
import { ZaloIcon } from './ZaloIcon';

export const SocialChatHubFloatingButton = () => {
  const { shopZaloPhone, facebookSettings } = useShop();
  const [copiedPhone, setCopiedPhone] = useState(false);

  const fbPageId = facebookSettings?.pageId || 'tiemhoaflorabloom';
  const isFbEnabled = facebookSettings?.isEnabled !== false;
  const currentPhone = shopZaloPhone || '0387970583';
  const cleanPhone = currentPhone.replace(/\s+/g, '');

  const handleCallClick = () => {
    // Tự động copy số điện thoại vào clipboard để tiện cho khách dùng máy tính
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cleanPhone).catch(() => {});
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2500);
    }
  };

  const handleOpenZalo = () => {
    openPersonalZaloChat(currentPhone, 'Chào shop Ngọc Flower, tôi muốn được tư vấn đặt hoa tươi!');
  };

  const handleOpenMessenger = () => {
    openFacebookMessenger(fbPageId, 'Chào shop Ngọc Flower, tôi muốn được tư vấn đặt hoa tươi!');
  };

  return (
    <aside 
      aria-label="Kênh liên hệ nhanh" 
      className="fixed bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2.5 sm:gap-3 print:hidden select-none"
    >
      {/* Toast thông báo đã sao chép số điện thoại */}
      {copiedPhone && (
        <div className="bg-[#1B3B2B] text-white text-[11px] font-medium py-1.5 px-3 rounded-full shadow-xl flex items-center gap-1.5 animate-fade-in border border-emerald-400/40 mb-1">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Đã sao chép: <strong>{currentPhone}</strong></span>
        </div>
      )}

      {/* 1. NÚT GỌI ĐIỆN BẰNG SĐT (CALL HOTLINE BUTTON) */}
      <div className="flex items-center gap-2 group">
        <a
          href={`tel:${cleanPhone}`}
          onClick={handleCallClick}
          className="hidden md:flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-emerald-800 text-xs font-bold py-2 px-3 rounded-full shadow-md border border-emerald-200 transition-all duration-200 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 pointer-events-none group-hover:pointer-events-auto"
        >
          <Phone className="w-3 h-3 text-emerald-600" />
          <span>Gọi ngay:</span>
          <span className="font-extrabold text-emerald-700">{currentPhone}</span>
        </a>

        <a
          href={`tel:${cleanPhone}`}
          onClick={handleCallClick}
          className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 hover:from-emerald-500 hover:to-teal-300 text-white shadow-lg hover:shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 border-2 border-white group/btn"
          title={`Gọi ngay số hotline: ${currentPhone}`}
          aria-label={`Gọi điện thoại cho shop số ${currentPhone}`}
        >
          {/* Hiệu ứng sóng radar tỏa ra (Pulse Ring) */}
          <span className="absolute -inset-1 rounded-full bg-emerald-500 opacity-40 animate-ping pointer-events-none" />
          <PhoneCall className="w-5 h-5 relative z-10 transition-transform group-hover/btn:rotate-12" />
        </a>
      </div>

      {/* 2. NÚT CHAT ZALO ĐỘC LẬP */}
      <div className="flex items-center gap-2 group">
        <button
          type="button"
          onClick={handleOpenZalo}
          className="hidden md:flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-[#0068FF] text-xs font-bold py-2 px-3 rounded-full shadow-md border border-blue-200 transition-all duration-200 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 pointer-events-none group-hover:pointer-events-auto"
        >
          <span>Chat Zalo:</span>
          <span className="font-extrabold">{currentPhone}</span>
        </button>

        <button
          type="button"
          onClick={handleOpenZalo}
          className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#0068FF] hover:bg-[#0055d4] text-white shadow-lg hover:shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 border-2 border-white group/btn"
          title={`Chat Zalo: ${currentPhone}`}
          aria-label={`Nhắn tin qua Zalo số ${currentPhone}`}
        >
          <ZaloIcon className="w-6 h-6 sm:w-7 sm:h-7 relative z-10 transition-transform group-hover/btn:scale-110" variant="white" />
          {/* Chấm trạng thái Online */}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-xs" />
        </button>
      </div>

      {/* 3. NÚT CHAT FACEBOOK MESSENGER ĐỘC LẬP */}
      {isFbEnabled && (
        <div className="flex items-center gap-2 group">
          <button
            type="button"
            onClick={handleOpenMessenger}
            className="hidden md:flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-purple-700 text-xs font-bold py-2 px-3 rounded-full shadow-md border border-purple-200 transition-all duration-200 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 pointer-events-none group-hover:pointer-events-auto"
          >
            <span>Chat Messenger</span>
          </button>

          <button
            type="button"
            onClick={handleOpenMessenger}
            className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-[#0084FF] via-[#7B3FE4] to-[#A824FF] hover:opacity-95 text-white shadow-lg hover:shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 border-2 border-white group/btn"
            title="Chat Facebook Messenger"
            aria-label="Nhắn tin qua Facebook Messenger"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current relative z-10 transition-transform group-hover/btn:scale-110" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.13 2 11.23c0 2.9 1.45 5.49 3.73 7.14v3.52c0 .4.44.66.79.46l3.9-2.14c.51.08 1.04.12 1.58.12 5.52 0 10-4.13 10-9.23S17.52 2 12 2zm1.06 12.35l-2.61-2.79-5.1 2.79 5.61-5.96 2.68 2.79 5.03-2.79-5.61 5.96z"/>
            </svg>
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-xs" />
          </button>
        </div>
      )}
    </aside>
  );
};
