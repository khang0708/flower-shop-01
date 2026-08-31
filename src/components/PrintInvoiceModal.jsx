import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Printer, X, Sparkles, FileText, Heart, CheckCircle2 } from 'lucide-react';

export const PrintInvoiceModal = ({ isOpen, onClose, order }) => {
  const { shopZaloPhone } = useShop();
  const [printSection, setPrintSection] = useState('all'); // 'all' | 'invoice_only' | 'card_only'

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedAmount = Number(order.totalAmount || 0).toLocaleString('vi-VN');

  return (
    <div 
      id="invoice-print-modal-container"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      {/* CSS Chuyên dụng cho in ấn và xuất file PDF */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          
          /* Ẩn toàn bộ DOM trang web phía sau */
          body * {
            visibility: hidden !important;
          }

          /* Chỉ hiển thị duy nhất khu vực in #invoice-printable-content */
          #invoice-printable-content,
          #invoice-printable-content * {
            visibility: visible !important;
          }

          #invoice-print-modal-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
          }

          #invoice-modal-card {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-page-break {
            break-before: page !important;
            page-break-before: always !important;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div 
        id="invoice-modal-card" 
        className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-gray-200 my-auto text-[#222523] animate-fade-in"
      >
        
        {/* Modal Header Controls (Ẩn hoàn toàn khi In) */}
        <div className="bg-[#1B3B2B] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#F5D6CE]">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold leading-tight">
                In Phiếu Giao Hoa & Thiệp Kẹp Hoa
              </h3>
              <p className="text-[11px] text-emerald-200">Đơn hàng: #{order.orderCode || order.id} • {order.customerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bộ chọn phần in */}
            <div className="flex bg-white/10 p-1 rounded-xl text-xs font-semibold text-white">
              <button
                type="button"
                onClick={() => setPrintSection('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  printSection === 'all' ? 'bg-[#E8998D] text-[#1B3B2B] font-bold shadow-xs' : 'hover:bg-white/10'
                }`}
              >
                In Cả Hai (A4)
              </button>
              <button
                type="button"
                onClick={() => setPrintSection('invoice_only')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  printSection === 'invoice_only' ? 'bg-[#E8998D] text-[#1B3B2B] font-bold shadow-xs' : 'hover:bg-white/10'
                }`}
              >
                Chỉ Phiếu Giao
              </button>
              <button
                type="button"
                onClick={() => setPrintSection('card_only')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  printSection === 'card_only' ? 'bg-[#E8998D] text-[#1B3B2B] font-bold shadow-xs' : 'hover:bg-white/10'
                }`}
              >
                Chỉ Thiệp Hoa
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="bg-[#E8998D] hover:bg-[#d8877b] text-[#1B3B2B] font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ml-1"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-base transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Area (Khu vực duy nhất được xuất ra trang in / PDF) */}
        <div id="invoice-printable-content" className="p-6 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto">
          
          {/* ======================================================== */}
          {/* PHẦN 1: PHIẾU GIAO HÀNG & HÓA ĐƠN XƯỞNG HOA (PACKING SLIP) */}
          {/* ======================================================== */}
          {(printSection === 'all' || printSection === 'invoice_only') && (
            <div className="border-2 border-dashed border-gray-400 p-6 rounded-2xl space-y-4 bg-white print-avoid-break">
              
              {/* Header Shop & Mã Đơn */}
              <div className="flex justify-between items-start border-b-2 border-gray-900 pb-3">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                    FLORA & BLOOM ATELIER
                  </h2>
                  <p className="text-[11px] text-gray-600 italic">Tiệm Hoa Tươi Nghệ Thuật & Thiết Kế Quà Tặng</p>
                  <p className="text-[10px] text-gray-700 mt-0.5 font-medium">📍 2 Hải Triều, P. Bến Nghé, Quận 1, TP.HCM • Hotline/Zalo: {shopZaloPhone}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 block">PHIẾU GIAO HOA</span>
                  <span className="font-mono text-xl font-black text-gray-950 block">
                    #{order.orderCode || order.id}
                  </span>
                  <span className="text-[10px] text-gray-600 font-medium">Giờ đặt: {order.createdAt || 'Hôm nay'}</span>
                </div>
              </div>

              {/* Thông Tin Khách Hàng & Người Nhận (2 Cột Rõ Ràng) */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-300 space-y-1">
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider block">Người Gửi Tặng:</span>
                  <p className="font-bold text-gray-950 text-sm">{order.customerName || 'Khách hàng'}</p>
                  <p className="text-gray-700">SĐT: <span className="font-mono font-bold">{order.customerPhone || 'Chưa cung cấp'}</span></p>
                  {order.isAnonymous && (
                    <span className="inline-block text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md mt-0.5 border border-amber-300">
                      🕵️ Giao Ẩn Danh (Tuyệt đối giữ bí mật tên người gửi)
                    </span>
                  )}
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-300 space-y-1">
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider block">Người Nhận Hoa:</span>
                  <p className="font-bold text-gray-950 text-sm">{order.receiverName || 'Người nhận'}</p>
                  <p className="text-gray-700">SĐT: <span className="font-mono font-bold text-gray-950">{order.receiverPhone || 'Chưa cung cấp'}</span></p>
                  <p className="text-gray-800 leading-snug">📍 <strong>Địa chỉ:</strong> {order.receiverAddress || 'Chưa cung cấp'}</p>
                  <p className="text-red-700 font-bold pt-0.5">⏱️ Hẹn giao: {order.deliverySlot}</p>
                </div>
              </div>

              {/* Bảng Chi Tiết Sản Phẩm & Quà Kèm */}
              <div className="border border-gray-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                      <th className="p-2 border-r border-gray-300 w-10 text-center">STT</th>
                      <th className="p-2 border-r border-gray-300">Sản Phẩm & Quà Kèm Theo Đơn</th>
                      <th className="p-2 text-right w-32">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-center text-gray-600 font-mono border-r border-gray-200">{idx + 1}</td>
                          <td className="p-2 font-semibold text-gray-950 border-r border-gray-200">{item.name}</td>
                          <td className="p-2 text-right font-bold text-gray-900 font-mono">
                            {Number(item.price || 0).toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-2 text-center font-mono border-r border-gray-200">1</td>
                        <td className="p-2 font-semibold text-gray-950 border-r border-gray-200">{order.productName}</td>
                        <td className="p-2 text-right font-bold font-mono">{formattedAmount}đ</td>
                      </tr>
                    )}
                    {/* Dòng Phí Giao Hoa */}
                    <tr className="bg-gray-50 text-gray-800">
                      <td className="p-2 text-center font-mono border-r border-gray-200">#</td>
                      <td className="p-2 font-medium border-r border-gray-200">
                        🚚 Phí giao hoa tận tay (Flora Express)
                        {order.isShippingConfirmed && <span className="text-[10px] text-emerald-800 font-bold ml-1.5">(Xưởng đã xác nhận)</span>}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-gray-900">
                        {Number(order.shippingFee || 0) === 0 ? 'Freeship (0đ)' : `${Number(order.shippingFee).toLocaleString('vi-VN')}đ`}
                      </td>
                    </tr>

                    {/* Dòng Giảm giá Voucher nếu có */}
                    {Number(order.discountAmount || 0) > 0 && (
                      <tr className="bg-rose-50/50 text-rose-800">
                        <td className="p-2 text-center font-mono border-r border-gray-200">%</td>
                        <td className="p-2 font-medium border-r border-gray-200">
                          🎁 Chiết khấu ưu đãi voucher
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-rose-700">
                          -{Number(order.discountAmount).toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    )}

                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                      <td colSpan={2} className="p-2 text-right text-gray-900 font-bold">
                        TỔNG CỘNG THANH TOÁN (ĐÃ GỒM SHIP & VAT):
                      </td>
                      <td className="p-2 text-right font-black text-gray-950 text-sm font-mono">
                        {formattedAmount}đ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Chữ Ký 3 Bên */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-gray-300 text-gray-600">
                <div>
                  <span className="font-bold block text-gray-900">Nghệ Nhân Cắm Hoa</span>
                  <span className="text-[10px] italic">Minh Thư (Xác nhận hoa tươi)</span>
                </div>
                <div>
                  <span className="font-bold block text-gray-900">Shipper Giao Hàng</span>
                  <span className="text-[10px] italic">Flora Express (Ký nhận)</span>
                </div>
                <div>
                  <span className="font-bold block text-gray-900">Khách Hàng Nhận Hoa</span>
                  <span className="text-[10px] italic">(Ký và ghi rõ họ tên)</span>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* PHẦN 2: THIỆP IN NGHỆ THUẬT KẸP VÀO BÓ HOA (GREETING CARD) */}
          {/* ======================================================== */}
          {(printSection === 'all' || printSection === 'card_only') && (
            <div className="border-2 border-emerald-800 p-6 rounded-2xl bg-[#FFFDF9] relative overflow-hidden print-avoid-break">
              
              <div className="flex items-center justify-between pb-2.5 border-b border-emerald-800/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-800" />
                  <span className="font-serif text-sm font-black text-emerald-950 uppercase tracking-widest">
                    Thiệp Chúc Mừng Nghệ Thuật
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-serif italic">Flora & Bloom Handwritten Card</span>
              </div>

              <div className="py-5 px-4 sm:px-8 text-center space-y-3.5">
                <p className="text-xs text-gray-700">
                  Gửi tặng đến: <strong className="text-sm text-gray-950 font-serif font-bold">{order.receiverName}</strong>
                </p>
                
                <div className="p-4 bg-white rounded-xl border border-dashed border-emerald-700 shadow-xs inline-block max-w-lg w-full">
                  <p className="font-serif text-base sm:text-lg italic text-emerald-950 leading-relaxed font-semibold">
                    "{order.cardMessage || 'Chúc bạn một ngày luôn rực rỡ và ngập tràn niềm vui!'}"
                  </p>
                </div>

                <p className="text-xs font-serif text-gray-800">
                  Thân ái từ: <strong className="text-sm text-emerald-900 font-black">{order.senderSign || order.customerName || 'Người gửi giấu tên'}</strong>
                </p>
              </div>

              <div className="text-center border-t border-gray-300 pt-2 text-[10px] text-gray-500 italic font-serif">
                🌸 "Mỗi đóa hoa là một sứ giả của tình yêu thương trọn vẹn" • florabloom.vn
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

