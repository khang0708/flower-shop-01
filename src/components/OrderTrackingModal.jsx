import React from 'react';
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
  MapPin
} from 'lucide-react';

export const OrderTrackingModal = () => {
  const { isTrackingOpen, setIsTrackingOpen, activeOrder, approvePhotoProof } = useShop();

  if (!isTrackingOpen || !activeOrder) return null;

  const steps = [
    { key: 'PENDING', label: 'Đã nhận đơn', time: '10:00', done: true },
    { key: 'ARRANGING', label: 'Đang cắm hoa thủ công', time: '10:15', done: true },
    { key: 'PHOTO_READY', label: 'Ảnh hoa chụp tại xưởng', time: '10:45', done: true },
    { key: 'DELIVERING', label: 'Shipper đang giao', time: '11:00', done: activeOrder.isApproved },
    { key: 'COMPLETED', label: 'Đã giao tận tay', time: '11:30', done: false },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[#E8EFEA] my-auto animate-fade-in">
        
        {/* Header */}
        <div className="bg-[#1B3B2B] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-200 uppercase tracking-widest block font-bold">
              Theo Dõi Tiến Trình Đơn Hoa
            </span>
            <h3 className="font-serif text-lg font-bold">
              Mã Đơn: #{activeOrder.orderCode}
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
        <div className="max-h-[80vh] overflow-y-auto p-6 space-y-6">
          
          {/* Florist In-Charge Header */}
          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8EFEA] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={activeOrder.floristAvatar}
                alt={activeOrder.floristName}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#1B3B2B]"
              />
              <div>
                <span className="text-[10px] text-gray-500 block">Nghệ nhân phụ trách đơn</span>
                <h4 className="text-xs font-bold text-[#1B3B2B]">{activeOrder.floristName}</h4>
                <span className="text-[10px] text-emerald-700 font-semibold">● Đang trực tiếp cắm tại xưởng</span>
              </div>
            </div>

            <div className="flex gap-1.5">
              <a
                href="tel:1900888999"
                className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-full text-[#1B3B2B] shadow-xs"
                title="Gọi nghệ nhân"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
              <a
                href="https://zalo.me"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-[#0068FF] text-white rounded-full hover:bg-blue-600 shadow-xs"
                title="Chat Zalo"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Stepper Trạng Thái Hoàn Chỉnh Không Bị Cắt */}
          <div className="pt-3 pb-1 px-1">
            <div className="relative">
              {/* Thanh line xám nền - căn đúng tâm vòng tròn 32px (top-4 = 16px) */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 z-0" />
              
              {/* Thanh tiến trình hoàn thành màu xanh */}
              <div 
                className="absolute top-4 left-6 h-0.5 bg-[#1B3B2B] z-0 transition-all duration-500" 
                style={{ 
                  width: activeOrder.isApproved ? 'calc(75% - 12px)' : 'calc(45% - 12px)' 
                }}
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
                    <span className="text-[10px] sm:text-[11px] font-semibold text-gray-700 mt-2 leading-snug break-words max-w-[85px]">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 📸 PROOF PHOTO: ẢNH HOA THẬT TẠI XƯỞNG ĐỂ KHÁCH DUYỆT */}
          <div className="bg-[#FAF4F0] p-5 rounded-2xl border border-[#F5D6CE] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#C4685A]" />
                <h4 className="font-serif text-base font-bold text-[#1B3B2B]">
                  Ảnh Chụp Bó Hoa Thực Tế Tại Xưởng
                </h4>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                activeOrder.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {activeOrder.isApproved ? '✓ Đã được bạn duyệt' : '⏳ Chờ bạn duyệt ảnh'}
              </span>
            </div>

            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-white shadow-md">
              <img
                src={activeOrder.proofPhotoUrl}
                alt="Ảnh hoa thực tế"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-md">
                Chụp lúc {activeOrder.createdAt} • Tại Xưởng Flora Studio
              </div>
            </div>

            {/* Nút Duyệt Ảnh */}
            {!activeOrder.isApproved ? (
              <div className="p-3 bg-white rounded-xl border border-[#E8998D] space-y-2">
                <p className="text-xs text-gray-700">
                  Vui lòng kiểm tra dáng hoa, màu sắc và thiệp. Nếu hài lòng, hãy bấm duyệt để shipper lên đường!
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={approvePhotoProof}
                    className="flex-1 bg-[#1B3B2B] hover:bg-[#264A37] text-white text-xs font-bold py-2.5 rounded-full shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Tôi Duyệt Ảnh Hoa Này - Cho Phép Giao Ngay</span>
                  </button>
                  <a
                    href="tel:1900888999"
                    className="text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2.5 rounded-full font-semibold"
                  >
                    Yêu Cầu Sửa
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Bạn đã duyệt mẫu hoa! Shipper Flora Express đang di chuyển đến địa chỉ giao.</span>
              </div>
            )}
          </div>

          {/* Chi tiết đơn & Người nhận */}
          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8EFEA] space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2 text-gray-900 font-semibold">
              <MapPin className="w-4 h-4 text-[#C4685A]" />
              <span>Giao đến: {activeOrder.receiverName} ({activeOrder.receiverPhone})</span>
            </div>
            <p className="pl-6 text-[11px] text-gray-500">{activeOrder.receiverAddress}</p>
            <p className="pl-6 text-[11px] text-[#1B3B2B] font-bold">
              ⏱️ Khung giờ hẹn: {activeOrder.deliverySlot}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
