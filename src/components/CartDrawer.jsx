import React from 'react';
import { useShop } from '../context/ShopContext';
import { openPersonalZaloChat } from '../services/zaloService';
import { openFacebookMessenger } from '../services/facebookService';
import { X, Trash2, Plus, Minus, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';

export const CartDrawer = () => {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateQuantity, 
    cartTotal,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    setIsCheckoutOpen,
    shopZaloPhone,
    facebookSettings
  } = useShop();

  const [couponInput, setCouponInput] = React.useState('');
  const [couponError, setCouponError] = React.useState('');
  const [isApplying, setIsApplying] = React.useState(false);

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

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-[#E8EFEA]">
          
          {/* Header */}
          <div className="p-5 bg-[#FAF8F5] border-b border-[#E8EFEA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💐</span>
              <h3 className="font-serif text-lg font-bold text-[#1B3B2B]">
                Giỏ Quà Hoa Tươi ({cart.length})
              </h3>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-4xl block mb-2">🌸</span>
                <p className="font-serif text-base font-bold text-[#1B3B2B]">Giỏ hàng của bạn đang trống</p>
                <p className="text-xs text-gray-400 mt-1">Hãy chọn cho người thương một bó hoa thật rạng rỡ nhé!</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 bg-[#1B3B2B] text-white text-xs font-semibold px-4 py-2 rounded-full"
                >
                  Khám phá mẫu hoa
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const itemKey = item.cartItemId || item.id;
                const addOnsTotal = (item.addOns || []).reduce((s, a) => s + a.price, 0);
                const itemSingleTotal = item.price + addOnsTotal;

                return (
                  <div 
                    key={itemKey}
                    className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8EFEA] space-y-3 relative group"
                  >
                    <div className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-20 object-cover rounded-xl border border-gray-200 flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-serif text-sm font-bold text-[#1B3B2B] truncate">
                            {item.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(itemKey)}
                            className="text-gray-400 hover:text-red-500 p-0.5 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <span className="text-[11px] bg-white border border-gray-200 text-[#1B3B2B] px-2 py-0.5 rounded-md font-medium inline-block mt-1">
                          {item.size?.name || 'Tiêu chuẩn'}
                        </span>

                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Gói: <em>{item.wrapper?.name || 'Giấy Xanh Sage'}</em>
                        </p>
                      </div>
                    </div>

                    {/* Card Message Snippet */}
                    {item.cardMessage && (
                      <div className="p-2 bg-white rounded-lg border border-dashed border-[#F5D6CE] text-[11px]">
                        <span className="text-gray-400 block text-[10px]">💌 Lời chúc thiệp:</span>
                        <p className="text-gray-700 italic line-clamp-1 font-script text-xs">
                          "{item.cardMessage}"
                        </p>
                      </div>
                    )}

                    {/* Add-ons list */}
                    {item.addOns?.length > 0 && (
                      <div className="text-[11px] text-gray-600 space-y-0.5">
                        {item.addOns.map((a, i) => (
                          <div key={i} className="flex justify-between">
                            <span>+ {a.name}</span>
                            <span className="font-semibold text-gray-800">{a.price.toLocaleString('vi-VN')}đ</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Price & Quantity Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/60">
                      <div className="flex items-center border border-gray-300 rounded-full bg-white">
                        <button
                          onClick={() => updateQuantity(itemKey, -1)}
                          className="p-1 text-gray-500 hover:text-black"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(itemKey, 1)}
                          className="p-1 text-gray-500 hover:text-black"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-sm font-extrabold text-[#1B3B2B] font-sans">
                        {(itemSingleTotal * item.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout */}
          {cart.length > 0 && (
            <div className="p-5 bg-[#FAF8F5] border-t border-[#E8EFEA] space-y-4">
              
              {/* Khung Nhập Mã Giảm Giá Voucher */}
              <div className="bg-white p-3 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700 flex items-center gap-1">
                    <span>🎟️</span> Mã Ưu Đãi / Voucher:
                  </span>
                  {appliedCoupon && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Đã áp dụng mã
                    </span>
                  )}
                </div>

                {!appliedCoupon ? (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="VD: FLORA10, VALENTINE50K"
                      className="flex-1 p-2 text-xs uppercase font-mono rounded-xl border border-gray-200 focus:outline-none focus:border-[#1B3B2B]"
                    />
                    <button
                      type="submit"
                      disabled={isApplying || !couponInput.trim()}
                      className="bg-[#1B3B2B] hover:bg-[#264A37] disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                    >
                      {isApplying ? '...' : 'Áp Dụng'}
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                    <div>
                      <strong className="font-mono text-[#1B3B2B] block font-bold">{appliedCoupon.code}</strong>
                      <span className="text-[11px] text-emerald-700">{appliedCoupon.name}</span>
                    </div>
                    <button
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

              {/* Chi tiết chi phí */}
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Tạm tính hoa & phụ kiện:</span>
                  <span className="font-bold text-gray-900">{cartTotal.toLocaleString('vi-VN')}đ</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Ưu đãi voucher ({appliedCoupon.code}):</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}

                <div className="flex justify-between text-emerald-700">
                  <span>Miễn phí in thiệp nghệ thuật:</span>
                  <span>0đ</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700">Tổng thanh toán:</span>
                <span className="text-xl font-extrabold text-[#1B3B2B] font-sans">
                  {Math.max(0, cartTotal - discountAmount).toLocaleString('vi-VN')}đ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {facebookSettings?.isEnabled !== false && (
                  <button
                    type="button"
                    onClick={() => {
                      const itemsSummary = cart.map(it => it.name).join(', ');
                      openFacebookMessenger(
                        facebookSettings?.pageId,
                        `Chào Flora & Bloom, tôi đang chọn các mẫu hoa trong giỏ: ${itemsSummary}. Tôi muốn nhờ tiệm tư vấn đổi hoa / viết thiệp riêng giúp tôi nhé!`
                      );
                    }}
                    className="py-2 px-2.5 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-[#7B3FE4] border border-purple-200 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                    title="Tư vấn giỏ hàng qua Facebook Messenger"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.13 2 11.23c0 2.9 1.45 5.49 3.73 7.14v3.52c0 .4.44.66.79.46l3.9-2.14c.51.08 1.04.12 1.58.12 5.52 0 10-4.13 10-9.23S17.52 2 12 2zm1.06 12.35l-2.61-2.79-5.1 2.79 5.61-5.96 2.68 2.79 5.03-2.79-5.61 5.96z"/>
                    </svg>
                    <span>Messenger</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const itemsSummary = cart.map(it => it.name).join(', ');
                    openPersonalZaloChat(
                      shopZaloPhone,
                      `Chào shop, tôi đang chọn các mẫu hoa: ${itemsSummary}. Tôi muốn nhờ shop tư vấn thêm!`
                    );
                  }}
                  className={`py-2 px-2.5 bg-blue-50/80 hover:bg-blue-100 text-[#0068FF] rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-blue-100 ${
                    facebookSettings?.isEnabled === false ? 'col-span-2' : ''
                  }`}
                  title={`Chat Zalo (${shopZaloPhone})`}
                >
                  <span className="font-extrabold text-xs">Z</span>
                  <span>Chat Zalo</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full bg-[#1B3B2B] hover:bg-[#264A37] text-white text-xs sm:text-sm font-bold py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Tiến Hành Đặt Hàng & Giao Hoa</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-center text-gray-400">
                🛡️ Cam kết gửi ảnh hoa hoàn thiện trước khi shipper lên đường
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
