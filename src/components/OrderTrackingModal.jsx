import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  X, 
  CheckCircle, 
  Clock, 
  Truck, 
  Camera, 
  PhoneCall, 
  MessageCircle, 
  ShieldCheck, 
  ThumbsUp,
  MapPin,
  Sparkles,
  Flower2,
  Eye,
  AlertCircle
} from 'lucide-react';

import { openPersonalZaloChat } from '../services/zaloService';

export const OrderTrackingModal = () => {
  const { isTrackingOpen, setIsTrackingOpen, activeOrder, approvePhotoProof, shopZaloPhone } = useShop();
  const [showCatalogRef, setShowCatalogRef] = useState(false);

  if (!isTrackingOpen || !activeOrder) return null;

  const handleChatZaloFlorist = () => {
    openPersonalZaloChat(
      shopZaloPhone,
      `Chào shop, tôi muốn hỏi thăm tiến độ cắm hoa cho mã đơn #${activeOrder.orderCode || activeOrder.id} (${activeOrder.productName || 'Bó Hoa'})`
    );
  };

  const hasRealPhoto = Boolean(activeOrder.proofPhotoUrl);
  const isDelivering = Boolean(activeOrder.isApproved || activeOrder.status === 'DELIVERING' || activeOrder.status === 'COMPLETED');
  const isCompleted = activeOrder.status === 'COMPLETED';

  const steps = [
    { key: 'PENDING', label: 'Đã nhận đơn', done: true },
    { key: 'ARRANGING', label: 'Đang cắm hoa thủ công', done: true },
    { key: 'PHOTO_READY', label: 'Ảnh hoa chụp tại xưởng', done: hasRealPhoto },
    { key: 'DELIVERING', label: 'Shipper đang giao', done: isDelivering },
    { key: 'COMPLETED', label: 'Đã giao tận tay', done: isCompleted },
  ];

  // Tính % tiến trình thanh bar
  const progressPercent = isCompleted ? 100 : isDelivering ? 75 : hasRealPhoto ? 50 : 25;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[#E8EFEA] my-auto animate-fade-in text-[#222523]">
        
        {/* Header */}
        <div className="bg-[#1B3B2B] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-200 uppercase tracking-widest block font-bold">
              Theo Dõi Tiến Trình Đơn Hoa
            </span>
            <h3 className="font-serif text-lg font-bold">
              Mã Đơn: #{activeOrder.orderCode || activeOrder.id}
            </h3>
          </div>
          <button 
            onClick={() => setIsTrackingOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg transition-all"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[82vh] overflow-y-auto p-6 space-y-6">
          
          {/* Florist In-Charge Header */}
          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8EFEA] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={activeOrder.floristAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                alt={activeOrder.florist || "Nghệ nhân Minh Thư"}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#1B3B2B] shadow-xs"
              />
              <div>
                <span className="text-[10px] text-gray-500 block">Nghệ nhân phụ trách đơn</span>
                <h4 className="text-xs font-bold text-[#1B3B2B]">{activeOrder.florist || 'Nghệ nhân Minh Thư'}</h4>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Đang trực tiếp cắm tại xưởng Studio A</span>
                </span>
              </div>
            </div>

            <div className="flex gap-1.5">
              <a
                href={`tel:${shopZaloPhone.replace(/\s+/g, '')}`}
                className="p-2.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-full text-[#1B3B2B] shadow-xs transition-transform active:scale-95"
                title={`Gọi nghệ nhân (${shopZaloPhone})`}
              >
                <PhoneCall className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={handleChatZaloFlorist}
                className="p-2.5 bg-[#0068FF] text-white rounded-full hover:bg-blue-600 shadow-xs transition-transform active:scale-95 flex items-center justify-center"
                title={`Chat Zalo Với Xưởng Hoa (${shopZaloPhone})`}
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stepper Trạng Thái Hoàn Chỉnh */}
          <div className="pt-3 pb-1 px-1">
            <div className="relative">
              {/* Thanh line xám nền */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 z-0" />
              
              {/* Thanh tiến trình hoàn thành màu xanh */}
              <div 
                className="absolute top-4 left-6 h-0.5 bg-[#1B3B2B] z-0 transition-all duration-500" 
                style={{ width: `calc(${progressPercent}% - 24px)` }}
              />

              <div className="flex justify-between items-start relative z-10">
                {steps.map((s, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 px-0.5 text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                      s.done 
                        ? 'bg-[#1B3B2B] text-white ring-4 ring-emerald-50' 
                        : 'bg-white border-2 border-gray-300 text-gray-400'
                    }`}>
                      {s.done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-[10px] sm:text-[11px] font-semibold mt-2 leading-snug break-words max-w-[85px] ${
                      s.done ? 'text-[#1B3B2B] font-bold' : 'text-gray-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 📸 PROOF PHOTO: KHUNG ẢNH HOA THẬT TẠI XƯỞNG (REALTIME SYNC) */}
          <div className="bg-[#FAF4F0] p-5 rounded-2xl border border-[#F5D6CE] space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#C4685A]" />
                <h4 className="font-serif text-base font-bold text-[#1B3B2B]">
                  Ảnh Chụp Bó Hoa Thực Tế Tại Xưởng
                </h4>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                activeOrder.isApproved 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : hasRealPhoto 
                  ? 'bg-amber-100 text-amber-800 animate-pulse' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {activeOrder.isApproved 
                  ? '✓ Đã được bạn duyệt' 
                  : hasRealPhoto 
                  ? '⏳ Đã có ảnh thật - Chờ bạn duyệt' 
                  : '🌸 Đang cắm hoa...'}
              </span>
            </div>

            {/* TRƯỜNG HỢP 1: ĐÃ CÓ ẢNH HOA THẬT DO NGHỆ NHÂN TẢI LÊN */}
            {hasRealPhoto ? (
              <div className="space-y-3 animate-fade-in">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white shadow-md group">
                  <img
                    src={activeOrder.proofPhotoUrl}
                    alt="Ảnh hoa thực tế tại xưởng"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-[#F5D6CE]" />
                    <span>Chụp thực tế lúc {activeOrder.proofPhotoTime || activeOrder.createdAt} • Xưởng Flora Studio</span>
                  </div>
                </div>

                {/* Ghi chú nghệ nhân nếu có */}
                {activeOrder.proofNote && (
                  <p className="p-3 bg-white rounded-xl border border-[#E8998D]/60 text-xs text-emerald-950 italic">
                    💬 <strong>Ghi chú từ nghệ nhân:</strong> "{activeOrder.proofNote}"
                  </p>
                )}

                {/* Khối Duyệt Ảnh & Cho Phép Giao */}
                {!activeOrder.isApproved ? (
                  <div className="p-4 bg-white rounded-2xl border border-[#E8998D] space-y-3 shadow-xs">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-[#C4685A] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-700">
                        Nghệ nhân vừa cắm hoàn thiện và tải ảnh thực tế lên hệ thống. Bạn vui lòng kiểm tra màu sắc, dáng hoa và thiệp. Nếu hài lòng, hãy bấm duyệt ngay để shipper xuất phát!
                      </p>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap gap-2 pt-1">
                      <button
                        onClick={approvePhotoProof}
                        className="flex-1 bg-[#1B3B2B] hover:bg-[#264A37] text-white text-xs font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <ThumbsUp className="w-4 h-4 text-[#F5D6CE]" />
                        <span>Tôi Duyệt Ảnh Hoa Này - Cho Phép Giao Ngay</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleChatZaloFlorist}
                        className="text-xs text-[#0068FF] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-3 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat Zalo Yêu Cầu Sửa</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium border border-emerald-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Bạn đã duyệt mẫu hoa thực tế! Shipper Flora Express đang di chuyển đến địa chỉ nhận.</span>
                  </div>
                )}
              </div>
            ) : (
              /* TRƯỜNG HỢP 2: ĐANG TRONG QUÁ TRÌNH CẮM HOA (CHƯA CÓ ẢNH THẬT) */
              <div className="p-6 bg-white rounded-2xl border-2 border-dashed border-[#E8998D]/70 text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-[#FAF4F0] text-[#C4685A] flex items-center justify-center mx-auto ring-4 ring-[#F5D6CE]/50">
                  <Flower2 className="w-6 h-6 animate-spin-slow" />
                </div>
                
                <div>
                  <h5 className="font-serif text-sm font-bold text-[#1B3B2B]">
                    Nghệ nhân đang tỉ mỉ cắm hoa thủ công...
                  </h5>
                  <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
                    Hoa của bạn đang được tuyển chọn từng cành tươi nhất và cắm theo yêu cầu. Ngay khi hoàn thiện, <strong>ảnh chụp hoa thật tại xưởng sẽ xuất hiện trực tiếp tại đây</strong> để bạn duyệt trước khi giao!
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Đang kết nối Realtime • Tự động cập nhật ảnh</span>
                </div>

                {/* Tùy chọn xem lại mẫu hoa catalog tham khảo */}
                {activeOrder.catalogSamplePhoto && (
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowCatalogRef(!showCatalogRef)}
                      className="text-xs text-gray-500 hover:text-gray-800 font-semibold inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{showCatalogRef ? 'Ẩn ảnh mẫu thiết kế gốc' : 'Xem lại ảnh mẫu thiết kế gốc tham khảo'}</span>
                    </button>

                    {showCatalogRef && (
                      <div className="mt-3 max-w-xs mx-auto aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 relative">
                        <img src={activeOrder.catalogSamplePhoto} alt="Mẫu tham khảo" className="w-full h-full object-cover opacity-80" />
                        <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-md">
                          Ảnh mẫu catalog tham khảo
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Chi tiết người nhận & Lời chúc thiệp */}
          <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8EFEA] space-y-3 text-xs text-gray-700">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <MapPin className="w-4 h-4 text-[#C4685A]" />
              <span>Giao đến: {activeOrder.receiverName} ({activeOrder.receiverPhone})</span>
            </div>
            <p className="pl-6 text-gray-600 leading-relaxed">📍 Địa chỉ: {activeOrder.receiverAddress}</p>
            <p className="pl-6 text-[#1B3B2B] font-bold">
              ⏱️ Khung giờ hẹn: {activeOrder.deliverySlot}
            </p>
            {activeOrder.cardMessage && (
              <div className="ml-6 p-3 bg-white rounded-xl border border-dashed border-[#E8998D] italic text-[#1B3B2B]">
                💌 Lời chúc thiệp: "{activeOrder.cardMessage}"
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

