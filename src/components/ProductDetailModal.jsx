import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { BOUQUET_SIZES, WRAPPING_PAPERS, ADDONS } from '../data/flowers';
import { CardPreviewer } from './CardPreviewer';
import { X, Check, Star, ShoppingBag, ShieldCheck, Truck } from 'lucide-react';

export const ProductDetailModal = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart } = useShop();

  if (!quickViewProduct) return null;

  const [selectedSize, setSelectedSize] = useState(BOUQUET_SIZES[0]);
  const [selectedWrapper, setSelectedWrapper] = useState(WRAPPING_PAPERS[0]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [cardMessage, setCardMessage] = useState('Chúc em một ngày luôn rực rỡ và xinh đẹp như những đóa hoa này! 🌸');
  const [senderSign, setSenderSign] = useState('Người thương em');

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => 
      prev.some(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const calculatedBasePrice = Math.round(quickViewProduct.price * selectedSize.priceMultiplier);
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const finalPrice = calculatedBasePrice + addonsTotal;

  const handleAddToCart = () => {
    addToCart(quickViewProduct, {
      size: selectedSize,
      wrapper: selectedWrapper,
      cardMessage,
      senderSign,
      addOns: selectedAddons,
    });
    setQuickViewProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-[#E8EFEA] my-auto animate-fade-in">
        
        {/* Modal Header */}
        <div className="bg-[#1B3B2B] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <span className="font-serif text-lg font-bold">Tùy Biến Bó Hoa Nghệ Thuật</span>
          </div>
          <button 
            onClick={() => setQuickViewProduct(null)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg transition-all"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[82vh] overflow-y-auto p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT TRÁI: ẢNH & THÔNG TIN CỐT LÕI (5 Cột) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-md border border-[#E8EFEA]">
              <img
                src={quickViewProduct.image}
                alt={quickViewProduct.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] px-3 py-1 rounded-full">
                📸 Ảnh mẫu tại xưởng
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold mb-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{quickViewProduct.rating}</span>
                <span className="text-gray-400">({quickViewProduct.reviewsCount} khách đã tặng)</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#1B3B2B]">
                {quickViewProduct.name}
              </h2>
              <p className="text-xs text-gray-500 italic mt-1">
                "{quickViewProduct.meaning}"
              </p>
            </div>

            <div className="p-3.5 bg-[#F4F7F5] rounded-xl border border-[#D1DFD6] space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-2 text-[#1B3B2B] font-semibold">
                <Truck className="w-4 h-4 text-[#5C8A70]" />
                <span>Giao hỏa tốc 60 - 90 phút hoặc hẹn giờ</span>
              </div>
              <div className="flex items-center gap-2 text-[#1B3B2B] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#C4685A]" />
                <span>Gửi ảnh chụp hoa hoàn thiện duyệt trước</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: TRÌNH TÙY BIẾN KÍCH CỠ, GIẤY GÓI, THIỆP & QUÀ (7 Cột) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Chọn Kích Cỡ Bó Hoa */}
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                1. Chọn Kích Cỡ Bó Hoa:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {BOUQUET_SIZES.map((sz) => {
                  const isSelected = selectedSize.id === sz.id;
                  const priceForSize = Math.round(quickViewProduct.price * sz.priceMultiplier);
                  return (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected 
                          ? 'border-[#1B3B2B] bg-[#F4F7F5] ring-2 ring-[#1B3B2B]/20 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="block text-xs font-bold text-[#1B3B2B]">{sz.name}</span>
                      <span className="block text-[11px] text-gray-500 my-1">{sz.desc}</span>
                      <span className="block text-xs font-extrabold text-[#C4685A]">
                        {priceForSize.toLocaleString('vi-VN')}đ
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Chọn Giấy Gói Nghệ Thuật */}
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                2. Chọn Phong Cách Giấy Gói & Ruy Băng:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WRAPPING_PAPERS.map((wp) => {
                  const isSelected = selectedWrapper.id === wp.id;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => setSelectedWrapper(wp)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition-all ${
                        isSelected 
                          ? 'border-[#1B3B2B] bg-[#1B3B2B] text-white font-semibold' 
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0" 
                        style={{ backgroundColor: wp.color }}
                      />
                      <span className="truncate">{wp.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Trình Soạn Thiệp Live Preview */}
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                3. Viết Thiệp Lời Chúc (Miễn Phí):
              </label>
              <CardPreviewer
                cardMessage={cardMessage}
                setCardMessage={setCardMessage}
                senderSign={senderSign}
                setSenderSign={setSenderSign}
                currentOccasion={quickViewProduct.occasion}
              />
            </div>

            {/* 4. Quà Tặng Kèm Thêm (Addons) */}
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                4. Chọn Thêm Món Quà Kèm (Tùy Chọn):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ADDONS.map((addon) => {
                  const isChecked = selectedAddons.some(a => a.id === addon.id);
                  return (
                    <label
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-[#C4685A] bg-[#FDF7F6] ring-1 ring-[#C4685A]' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{addon.img}</span>
                        <div>
                          <span className="font-semibold text-gray-800 block">{addon.name}</span>
                          <span className="text-gray-500 font-medium">+{addon.price.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isChecked ? 'bg-[#C4685A] border-[#C4685A] text-white' : 'border-gray-300'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Footer Nút Thêm Giỏ Hàng & Tính Giá */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-500 block">Tổng thanh toán mẫu này:</span>
                <span className="text-2xl font-extrabold text-[#1B3B2B] font-sans">
                  {finalPrice.toLocaleString('vi-VN')}đ
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                className="bg-[#1B3B2B] hover:bg-[#264A37] text-white text-xs sm:text-sm font-semibold px-6 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 text-[#F5D6CE]" />
                <span>Thêm Vào Giỏ & Đặt Ngay</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
