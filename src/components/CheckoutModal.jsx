import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  X, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  QrCode, 
  CreditCard, 
  ShieldCheck, 
  Camera, 
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';

import { openPersonalZaloChat } from '../services/zaloService';

export const CheckoutModal = () => {
  const { 
    isCheckoutOpen, 
    setIsCheckoutOpen, 
    cart, 
    cartTotal, 
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    shippingSettings,
    getShippingFee,
    submitOrder,
    shopZaloPhone
  } = useShop();

  if (!isCheckoutOpen) return null;

  // Coupon state in Checkout
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setIsApplying(true);
    try {
      await applyCoupon(couponInput);
      setCouponInput('');
    } catch (err) {
      setCouponError(err.message);
    } finally {
      setIsApplying(false);
    }
  };

  // Form State
  const [senderName, setSenderName] = useState('Nguyễn Hoàng Nam');
  const [senderPhone, setSenderPhone] = useState('0909 123 456');
  const [receiverName, setReceiverName] = useState('Trần Ngọc Bích');
  const [receiverPhone, setReceiverPhone] = useState('0988 765 432');
  const [receiverAddress, setReceiverAddress] = useState('Phòng 402, Tòa nhà Bitexco, 2 Hải Triều, P. Bến Nghé, Quận 1, TP.HCM');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [requestPhotoProof, setRequestPhotoProof] = useState(true);
  
  // Delivery Schedule
  const [deliveryType, setDeliveryType] = useState('timeslot'); // 'express' | 'timeslot'
  const [selectedSlot, setSelectedSlot] = useState('14:00 - 16:00 Hôm nay');
  const [deliveryDate, setDeliveryDate] = useState('Hôm nay (25/08)');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('qr_transfer'); // 'qr_transfer' | 'momo' | 'card'

  // Tính toán phí ship động dựa trên cấu hình xưởng hoa
  const shippingFee = getShippingFee(deliveryType, cartTotal);
  const grandTotal = Math.max(0, cartTotal + shippingFee - discountAmount);
  const isFreeshipEligible = shippingSettings?.isFreeShippingEnabled && cartTotal >= (shippingSettings?.freeShippingThreshold || 1000000);

  const handleSubmit = (e) => {
    e.preventDefault();
    submitOrder({
      senderName,
      senderPhone,
      receiverName,
      receiverPhone,
      receiverAddress,
      isAnonymous,
      deliveryType,
      shippingFee,
      deliverySlot: deliveryType === 'express' ? '⚡ Hỏa tốc 60 - 90 phút' : `${deliveryDate} (${selectedSlot})`,
      paymentMethod,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-[#E8EFEA] my-auto animate-fade-in">
        
        {/* Header */}
        <div className="bg-[#1B3B2B] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌸</span>
            <span className="font-serif text-lg font-bold">Thanh Toán Đơn Gửi Tặng Hoa</span>
          </div>
          <button 
            onClick={() => setIsCheckoutOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg transition-all"
          >
            ✕
          </button>
        </div>

        {/* Checkout Body Form */}
        <form onSubmit={handleSubmit} className="max-h-[82vh] overflow-y-auto p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT TRÁI: FORM ĐIỀN THÔNG TIN (7 Cột) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Thông tin người đặt */}
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8EFEA] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-[#1B3B2B] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1B3B2B] text-white text-[11px] flex items-center justify-center font-sans">1</span>
                  Thông Tin Của Bạn (Người Đặt)
                </h3>
                <span className="text-[10px] text-gray-400">Bảo mật thông tin</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Họ tên của bạn *</label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1B3B2B] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Số điện thoại nhận ảnh hoa *</label>
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1B3B2B] bg-white"
                  />
                </div>
              </div>

              {/* Tùy chọn gửi ảnh hoa */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requestPhotoProof}
                  onChange={(e) => setRequestPhotoProof(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1B3B2B] accent-[#1B3B2B]"
                />
                <span className="text-xs text-gray-700 font-medium">
                  📸 Gửi ảnh hoa thực tế qua Zalo/SMS cho tôi duyệt trước khi giao
                </span>
              </label>
            </div>

            {/* 2. Thông tin người nhận & Tùy chọn ẩn danh */}
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8EFEA] space-y-3">
              <h3 className="font-serif text-base font-bold text-[#1B3B2B] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1B3B2B] text-white text-[11px] flex items-center justify-center font-sans">2</span>
                Thông Tin Người Nhận Hoa
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Họ tên người nhận *</label>
                  <input
                    type="text"
                    required
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1B3B2B] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Số điện thoại người nhận *</label>
                  <input
                    type="tel"
                    required
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1B3B2B] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Địa chỉ giao hoa chi tiết *</label>
                <input
                  type="text"
                  required
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  placeholder="Số nhà, tầng/phòng, tên tòa nhà, tên đường, Phường, Quận..."
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1B3B2B] bg-white"
                />
              </div>

              {/* Checkbox Ẩn danh */}
              <div className="p-3 bg-[#FAF4F0] rounded-xl border border-[#F5D6CE] flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="anonymousCheck"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#C4685A] accent-[#C4685A]"
                />
                <label htmlFor="anonymousCheck" className="text-xs text-[#5A3831] cursor-pointer">
                  <strong className="block font-bold">🕵️ Giao hoa ẩn danh (Bí mật người gửi)</strong>
                  Shop tuyệt đối không ghi tên bạn lên đơn giao và không tiết lộ khi shipper liên hệ.
                </label>
              </div>
            </div>

            {/* 3. Thời gian giao hoa */}
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8EFEA] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-[#1B3B2B] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1B3B2B] text-white text-[11px] flex items-center justify-center font-sans">3</span>
                  Thời Gian & Khung Giờ Giao
                </h3>
                {isFreeshipEligible ? (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Đạt Miễn Phí Giao</span>
                  </span>
                ) : shippingSettings?.isFreeShippingEnabled && (
                  <span className="text-[10px] text-gray-500 font-medium">
                    Freeship từ {Number(shippingSettings.freeShippingThreshold || 1000000).toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeliveryType('timeslot')}
                  className={`p-3 rounded-xl text-left border text-xs transition-all ${
                    deliveryType === 'timeslot' 
                      ? 'border-[#1B3B2B] bg-[#F4F7F5] font-semibold text-[#1B3B2B] ring-1 ring-[#1B3B2B]' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">📅 Khung giờ chọn trước</span>
                    <span className={`text-[11px] font-mono font-bold ${isFreeshipEligible ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {getShippingFee('timeslot', cartTotal) === 0 ? 'Freeship (0đ)' : `${getShippingFee('timeslot', cartTotal).toLocaleString('vi-VN')}đ`}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 block mt-0.5">Giao đúng giờ hẹn bất ngờ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('express')}
                  className={`p-3 rounded-xl text-left border text-xs transition-all ${
                    deliveryType === 'express' 
                      ? 'border-[#C4685A] bg-[#FDF7F6] font-semibold text-[#C4685A] ring-1 ring-[#C4685A]' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">⚡ Hỏa tốc 60 - 90 phút</span>
                    <span className="text-[11px] font-mono font-bold text-[#C4685A]">
                      {getShippingFee('express', cartTotal).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 block mt-0.5">Ưu tiên cắm ngay & giao gấp</span>
                </button>
              </div>

              {deliveryType === 'timeslot' && (
                <div className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    {['Hôm nay (25/08)', 'Ngày mai (26/08)', 'Chọn ngày khác 📅'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDeliveryDate(d)}
                        className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${
                          deliveryDate === d ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]' : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['08:00 - 10:00', '10:00 - 12:00', '14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:00', 'Đúng 00:00 Đêm'].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-2.5 text-xs rounded-lg border transition-all text-center ${
                          selectedSlot === slot 
                            ? 'bg-[#5C8A70] text-white font-bold border-[#5C8A70]' 
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Phương thức thanh toán */}
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8EFEA] space-y-3">
              <h3 className="font-serif text-base font-bold text-[#1B3B2B] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1B3B2B] text-white text-[11px] flex items-center justify-center font-sans">4</span>
                Phương Thức Thanh Toán
              </h3>

              <div className="space-y-2">
                {[
                  { id: 'qr_transfer', label: 'Quét mã VietQR chuyển khoản tức thì (Miễn phí)', badge: 'Khuyên dùng', icon: '📱' },
                  { id: 'momo', label: 'Ví MoMo / ZaloPay', badge: 'Tiện lợi', icon: '🟣' },
                  { id: 'card', label: 'Thẻ Quốc tế Visa / Mastercard', badge: 'Quốc tế', icon: '💳' },
                ].map((m) => (
                  <label
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      paymentMethod === m.id 
                        ? 'border-[#1B3B2B] bg-white ring-1 ring-[#1B3B2B] shadow-sm' 
                        : 'border-gray-200 bg-white/70 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{m.icon}</span>
                      <span className="font-semibold text-gray-800">{m.label}</span>
                    </div>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {m.badge}
                    </span>
                  </label>
                ))}
              </div>

              {/* Dynamic VietQR Preview Mockup */}
              {paymentMethod === 'qr_transfer' && (
                <div className="p-4 bg-white rounded-xl border border-dashed border-[#5C8A70] flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center p-1.5 flex-shrink-0">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=FLORABLOOM_ORDER_PAYMENT" 
                      alt="VietQR" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[11px] text-gray-600 space-y-1">
                    <span className="font-bold text-[#1B3B2B] block text-xs">Mã QR VietQR Tự Động</span>
                    <p>Ngân hàng: <strong>Techcombank (1903 888 666)</strong></p>
                    <p>Chủ TK: <strong>FLORA & BLOOM ATELIER</strong></p>
                    <p className="text-emerald-700 font-semibold">Tự động kích hoạt đơn ngay khi quét</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG (5 Cột) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8EFEA] space-y-4 sticky top-4">
              <h3 className="font-serif text-base font-bold text-[#1B3B2B] pb-2 border-b border-gray-200">
                Tóm Tắt Đơn Quà Tặng ({cart.length})
              </h3>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.cartItemId || item.id} className="flex gap-2.5 text-xs pb-2 border-b border-gray-100">
                    <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded-lg border flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-serif font-bold text-[#1B3B2B] truncate">{item.name}</h5>
                      <span className="text-[10px] text-gray-500">{item.size?.name || 'Tiêu chuẩn'} × {item.quantity}</span>
                      <span className="block font-bold text-[#C4685A] mt-0.5">{item.price.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Khung Nhập Mã Voucher / Khuyến Mãi */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700 flex items-center gap-1">
                    <span>🎟️</span> Mã Giảm Giá / Voucher:
                  </span>
                  {appliedCoupon && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Đã áp dụng
                    </span>
                  )}
                </div>

                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Nhập mã (VD: FLORA10)"
                      className="flex-1 p-2 text-xs uppercase font-mono rounded-xl border border-gray-200 focus:outline-none focus:border-[#1B3B2B]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplying || !couponInput.trim()}
                      className="bg-[#1B3B2B] hover:bg-[#264A37] disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                    >
                      {isApplying ? '...' : 'Áp Dụng'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                    <div>
                      <strong className="font-mono text-[#1B3B2B] block font-bold">{appliedCoupon.code}</strong>
                      <span className="text-[11px] text-emerald-700">{appliedCoupon.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-red-500 hover:text-red-700 font-bold text-xs p-1"
                      title="Gỡ mã giảm giá"
                    >
                      ✕ Gỡ
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-[11px] text-red-600 italic">{couponError}</p>
                )}
              </div>

              {/* Chi phí */}
              <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>Tiền hoa & quà:</span>
                  <span className="font-semibold text-gray-900">{cartTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí giao hoa tận tay:</span>
                  <span className="font-semibold text-gray-900">{shippingFee.toLocaleString('vi-VN')}đ</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Ưu đãi voucher ({appliedCoupon.code}):</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}

                <div className="flex justify-between text-emerald-700">
                  <span>Thiệp in nghệ thuật:</span>
                  <span>Miễn phí (0đ)</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 block">Tổng thanh toán:</span>
                  <span className="text-2xl font-extrabold text-[#1B3B2B] font-sans">
                    {grandTotal.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <span className="text-[10px] bg-[#EBF2ED] text-[#1B3B2B] font-bold px-2 py-1 rounded-md">
                  ĐÃ GỒM VAT
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full bg-[#1B3B2B] hover:bg-[#264A37] text-white font-bold text-sm py-4 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-[#F5D6CE]" />
                <span>Hoàn Tất Đặt Hoa Ngay</span>
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => openPersonalZaloChat(shopZaloPhone, 'Chào shop, tôi đang ở bước thanh toán đơn hoa và cần hỗ trợ tư vấn gấp!')}
                  className="text-xs text-[#0068FF] hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <span>💬 Cần hỗ trợ đặt gấp / thanh toán? Chat Zalo ({shopZaloPhone})</span>
                </button>
              </div>

              <div className="text-[10px] text-gray-400 text-center space-y-1">
                <p>🔒 Bảo mật thông tin đơn hàng tuyệt đối</p>
                <p>🌸 Đổi mới 100% nếu hoa không tươi hoặc dập gãy</p>
              </div>

            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
