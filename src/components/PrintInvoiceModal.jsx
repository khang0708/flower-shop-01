import React, { useRef } from 'react';
import { Printer, X, Heart, MapPin, Phone, Calendar, Clock, Sparkles } from 'lucide-react';

export const PrintInvoiceModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedAmount = Number(order.totalAmount || 0).toLocaleString('vi-VN');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-gray-200 my-auto text-[#222523] print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Modal Controls (Ẩn khi In) */}
        <div className="bg-[#1B3B2B] text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#F5D6CE]" />
            <h3 className="font-serif text-base sm:text-lg font-bold">
              Xem & In Phiếu Giao Hoa / Thiệp Nghệ Thuật
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#E8998D] hover:bg-[#d8877b] text-[#1B3B2B] font-bold text-xs px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-base"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 sm:p-8 space-y-6 print:p-4 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
          
          {/* PHẦN 1: PHIẾU GIAO HÀNG & HÓA ĐƠN XƯỞNG HOA */}
          <div className="border-2 border-dashed border-gray-300 p-6 rounded-2xl space-y-5 bg-[#FAF8F5] print:bg-white print:border-gray-800 print:rounded-none">
            
            {/* Header Shop & Mã Đơn */}
            <div className="flex justify-between items-start border-b border-gray-300 pb-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-extrabold text-[#1B3B2B] tracking-tight">
                  FLORA & BLOOM ATELIER
                </h2>
                <p className="text-xs text-gray-500 italic mt-0.5">Tiệm Hoa Tươi Nghệ Thuật & Thiết Kế Quà Tặng</p>
                <p className="text-[11px] text-gray-600 mt-1">📍 2 Hải Triều, P. Bến Nghé, Quận 1, TP.HCM • Hotline: 1900 888 999</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-gray-400 block">PHIẾU GIAO HOA</span>
                <span className="font-mono text-lg font-extrabold text-[#1B3B2B] block">
                  #{order.orderCode || order.id}
                </span>
                <span className="text-[11px] text-gray-500">Giờ đặt: {order.createdAt || 'Hôm nay'}</span>
              </div>
            </div>

            {/* Thông Tin Khách Hàng & Người Nhận (2 Cột) */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1 print:border-gray-400">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Người Gửi Tặng:</span>
                <p className="font-bold text-gray-900 text-sm">{order.customerName || 'Khách hàng'}</p>
                <p className="text-gray-600">SĐT: <span className="font-mono">{order.customerPhone || 'Chưa cung cấp'}</span></p>
                {order.isAnonymous && (
                  <span className="inline-block text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md mt-1">
                    🕵️ Giao Ẩn Danh (Bí Mật Tên)
                  </span>
                )}
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1 print:border-gray-400">
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Người Nhận Hoa:</span>
                <p className="font-bold text-[#1B3B2B] text-sm">{order.receiverName || 'Người nhận'}</p>
                <p className="text-gray-600">SĐT: <span className="font-mono font-bold text-gray-900">{order.receiverPhone || 'Chưa cung cấp'}</span></p>
                <p className="text-gray-700 leading-snug">📍 {order.receiverAddress || 'Chưa cung cấp'}</p>
                <p className="text-[#C4685A] font-bold pt-0.5">⏱️ Giờ hẹn: {order.deliverySlot}</p>
              </div>
            </div>

            {/* Bảng Chi Tiết Sản Phẩm & Quà Kèm */}
            <div className="border border-gray-200 rounded-xl overflow-hidden print:border-gray-400">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200 print:bg-gray-200">
                    <th className="p-2.5">STT</th>
                    <th className="p-2.5">Sản Phẩm & Quà Kèm Theo Đơn</th>
                    <th className="p-2.5 text-right">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 text-gray-500 font-mono w-8">{idx + 1}</td>
                        <td className="p-2.5 font-semibold text-gray-900">{item.name}</td>
                        <td className="p-2.5 text-right font-bold text-gray-800 font-mono">
                          {Number(item.price || 0).toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-2.5 font-mono w-8">1</td>
                      <td className="p-2.5 font-semibold text-gray-900">{order.productName}</td>
                      <td className="p-2.5 text-right font-bold font-mono">{formattedAmount}đ</td>
                    </tr>
                  )}
                  <tr className="bg-gray-50 font-bold print:bg-gray-100">
                    <td colSpan={2} className="p-2.5 text-right text-gray-700">TỔNG CỘNG THANH TOÁN (ĐÃ GỒM SHIP & VAT):</td>
                    <td className="p-2.5 text-right font-extrabold text-[#1B3B2B] text-sm font-mono">
                      {formattedAmount}đ
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Chữ Ký Giao Nhận */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-4 border-t border-gray-200 text-gray-500">
              <div>
                <span className="font-bold block text-gray-700">Nghệ Nhân Cắm Hoa</span>
                <span className="text-[10px] italic">Minh Thư (Xác nhận tươi 100%)</span>
              </div>
              <div>
                <span className="font-bold block text-gray-700">Nhân Viên Giao Hàng</span>
                <span className="text-[10px] italic">Flora Express (Ký nhận)</span>
              </div>
              <div>
                <span className="font-bold block text-gray-700">Khách Hàng Nhận Hoa</span>
                <span className="text-[10px] italic">(Ký và ghi rõ họ tên)</span>
              </div>
            </div>

          </div>

          {/* PHẦN 2: THIỆP IN NGHỆ THUẬT KẸP VÀO BÓ HOA (GREETING CARD SLIP) */}
          <div className="border-2 border-emerald-800/40 p-6 rounded-2xl bg-gradient-to-b from-[#FFFDF9] to-[#FAF4F0] relative overflow-hidden print:bg-white print:border-emerald-800 print:rounded-none">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E8998D]/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C4685A]" />
                <span className="font-serif text-sm font-bold text-[#1B3B2B] uppercase tracking-widest">
                  Thiệp Chúc Mừng Nghệ Thuật
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-serif italic">Flora & Bloom Handwritten Card</span>
            </div>

            <div className="py-6 px-4 sm:px-8 text-center space-y-4">
              <p className="text-xs text-gray-500">Gửi tặng đến: <strong className="text-sm text-gray-900 font-serif">{order.receiverName}</strong></p>
              
              <div className="p-4 bg-white/80 rounded-2xl border border-dashed border-[#E8998D] shadow-xs inline-block max-w-lg">
                <p className="font-serif text-base sm:text-lg italic text-[#1B3B2B] leading-relaxed">
                  "{order.cardMessage || 'Chúc bạn một ngày luôn rực rỡ và ngập tràn niềm vui!'}"
                </p>
              </div>

              <p className="text-xs font-serif text-gray-600">
                Thân ái từ: <strong className="text-sm text-[#C4685A] font-bold">{order.senderSign || order.customerName || 'Người gửi giấu tên'}</strong>
              </p>
            </div>

            <div className="text-center border-t border-gray-200/60 pt-2 text-[10px] text-gray-400 italic font-serif">
              🌸 "Mỗi đóa hoa là một sứ giả của tình yêu thương trọn vẹn" • florabloom.vn
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
