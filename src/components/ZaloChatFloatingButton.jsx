import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { openPersonalZaloChat } from '../services/zaloService';
import { MessageCircle, X, Sparkles, Send, PhoneCall } from 'lucide-react';
import { ZaloIcon } from './ZaloIcon';

export const ZaloChatFloatingButton = () => {
  const { shopZaloPhone } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [quickMessage, setQuickMessage] = useState('Chào Ngọc Flower, tôi muốn tư vấn mẫu bó hoa...');

  const handleOpenZalo = () => {
    openPersonalZaloChat(shopZaloPhone);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      
      {/* Mini Popup tư vấn nhanh Zalo Cá Nhân */}
      {isOpen && (
        <div className="mb-3 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-blue-200 overflow-hidden animate-fade-in text-[#222523]">
          {/* Header */}
          <div className="bg-[#0068FF] text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs">
                <ZaloIcon className="w-5 h-5" variant="blue" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">Chat Zalo Cá Nhân Chủ Shop</h4>
                <span className="text-[10px] text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Zalo: <strong>{shopZaloPhone}</strong>
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white text-sm">✕</button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 text-xs">
            <p className="text-gray-600 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 leading-relaxed">
              🌸 Nhắn tin trực tiếp với chủ shop qua <strong>Zalo cá nhân</strong> để gửi mẫu hoa, chọn thiệp và gọi video xem hoa thực tế.
            </p>

            <div className="space-y-1.5">
              <button
                onClick={handleOpenZalo}
                className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-[11px] text-gray-700 transition-colors"
              >
                ⚡ "Tôi muốn đặt hoa giao gấp 60 phút!"
              </button>
              <button
                onClick={handleOpenZalo}
                className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-[11px] text-gray-700 transition-colors"
              >
                🎂 "Tư vấn bó hoa sinh nhật dưới 1 triệu"
              </button>
            </div>

            <button
              onClick={handleOpenZalo}
              className="w-full bg-[#0068FF] hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Mở Zalo ({shopZaloPhone}) & Nhắn Tin Ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Zalo Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-[#0068FF] hover:bg-blue-600 text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 relative group border-2 border-white"
        title={`Chat Zalo Cá Nhân (${shopZaloPhone})`}
        aria-label={`Chat Zalo tư vấn hoa tươi với shop số ${shopZaloPhone}`}
      >
        <ZaloIcon className="w-7 h-7" variant="white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
      </button>

    </div>
  );
};
