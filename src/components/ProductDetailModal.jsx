import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { BOUQUET_SIZES, WRAPPING_PAPERS, ADDONS } from '../data/flowers';
import { CardPreviewer } from './CardPreviewer';
import { openPersonalZaloChat } from '../services/zaloService';
import { generateMessengerProductInquiry } from '../services/facebookService';
import { 
  X, 
  Check, 
  Star, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  Clock, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { ZaloIcon } from './ZaloIcon';

export const ProductDetailModal = () => {
  const { 
    quickViewProduct, 
    setQuickViewProduct, 
    addToCart, 
    shopZaloPhone, 
    facebookSettings 
  } = useShop();

  if (!quickViewProduct) return null;

  const isWedding = quickViewProduct.category === 'weddings';
  const isFruit = quickViewProduct.category === 'fruits';

  // State cho Hoa Tươi & Giỏ Trái Cây
  const [selectedSize, setSelectedSize] = useState(BOUQUET_SIZES[0]);
  const [selectedWrapper, setSelectedWrapper] = useState(WRAPPING_PAPERS[0]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [cardMessage, setCardMessage] = useState('Chúc bạn luôn bình an, may mắn và hạnh phúc viên mãn! 🌸');
  const [senderSign, setSenderSign] = useState('Người thương');

  // State cho Rạp Cưới Hỏi (Khảo sát)
  const [weddingDate, setWeddingDate] = useState('');
  const [weddingAddress, setWeddingAddress] = useState('');

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => 
      prev.some(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  // Tính giá
  const calculatedBasePrice = isWedding
    ? quickViewProduct.price
    : Math.round(quickViewProduct.price * (isFruit ? 1.0 : selectedSize.priceMultiplier));
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const finalPrice = calculatedBasePrice + addonsTotal;

  const handleAddToCart = () => {
    addToCart(quickViewProduct, {
      size: isFruit ? { name: 'Giỏ Tiêu Chuẩn' } : selectedSize,
      wrapper: selectedWrapper,
      cardMessage,
      senderSign,
      addOns: selectedAddons,
    });
    setQuickViewProduct(null);
  };

  // Handler Báo Giá Zalo cho cả 3 danh mục
  const handleZaloQuote = () => {
    let message = '';
    if (isWedding) {
      message = `Chào shop Ngọc Flower, tôi quan tâm gói "${quickViewProduct.name}" (Giá tham khảo: ${finalPrice.toLocaleString('vi-VN')}đ).\n` +
        `- Ngày làm lễ dự kiến: ${weddingDate || 'Đang chọn ngày'}\n` +
        `- Địa chỉ dự kiến: ${weddingAddress || 'Chưa cập nhật'}\n` +
        `Xin tư vấn và đặt lịch khảo sát mặt bằng tận nơi giúp tôi!`;
    } else if (isFruit) {
      message = `Chào shop Ngọc Flower, tôi muốn nhận báo giá giỏ trái cây "${quickViewProduct.name}".\n` +
        `- Tone nơ/giấy bọc: ${selectedWrapper.name}\n` +
        `- Tổng giá ước tính: ${finalPrice.toLocaleString('vi-VN')}đ\n` +
        `- Lời chúc in thiệp: "${cardMessage}" (Ký tên: ${senderSign})\n` +
        `Xin shop gửi hình ảnh thực tế và tư vấn giúp tôi!`;
    } else {
      message = `Chào shop Ngọc Flower, tôi muốn nhận báo giá mẫu hoa tươi "${quickViewProduct.name}".\n` +
        `- Kích thước: ${selectedSize.name}\n` +
        `- Phong cách gói: ${selectedWrapper.name}\n` +
        `- Tổng giá ước tính: ${finalPrice.toLocaleString('vi-VN')}đ\n` +
        `- Lời chúc thiệp: "${cardMessage}" (Ký tên: ${senderSign})\n` +
        `Xin shop gửi ảnh hoa cắm thực tế và thời gian giao hoa giúp tôi!`;
    }
    openPersonalZaloChat(shopZaloPhone, message);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-[#E8EFEA] my-auto animate-fade-in">
        
        {/* Modal Header */}
        <div className="bg-[#1B3B2B] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {isWedding ? '🎪' : isFruit ? '🍇' : '🌿'}
            </span>
            <span className="font-serif text-base sm:text-lg font-bold">
              {isWedding 
                ? 'Chi Tiết Gói Dịch Vụ Cưới Hỏi & Gia Tiên' 
                : isFruit 
                ? 'Chi Tiết & Tùy Biến Giỏ Trái Cây Nghệ Thuật' 
                : 'Tùy Biến Bó Hoa Nghệ Thuật'}
            </span>
          </div>
          <button 
            onClick={() => setQuickViewProduct(null)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg transition-all cursor-pointer"
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
                {isWedding ? '📸 Ảnh thực tế thi công' : '📸 Ảnh chụp mẫu tại tiệm'}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold mb-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{quickViewProduct.rating}</span>
                <span className="text-gray-400">({quickViewProduct.reviewsCount} khách hàng tin chọn)</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#1B3B2B]">
                {quickViewProduct.name}
              </h2>
              <p className="text-xs text-gray-500 italic mt-1">
                "{quickViewProduct.meaning}"
              </p>
            </div>

            {/* Badges cam kết */}
            <div className="p-3.5 bg-[#F4F7F5] rounded-xl border border-[#D1DFD6] space-y-1.5 text-xs text-gray-600">
              {isWedding ? (
                <>
                  <div className="flex items-center gap-2 text-[#1B3B2B] font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-[#5C8A70]" />
                    <span>Khảo sát mặt bằng tận nơi 0đ trong 2 giờ</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#1B3B2B] font-semibold">
                    <ShieldCheck className="w-4 h-4 text-[#C4685A]" />
                    <span>Khung rạp kiên cố, bạt chống nóng chống mưa 100%</span>
                  </div>
                </>
              ) : isFruit ? (
                <>
                  <div className="flex items-center gap-2 text-[#1B3B2B] font-semibold">
                    <Truck className="w-4 h-4 text-[#5C8A70]" />
                    <span>Giao hỏa tốc 60 - 90 phút bảo quản mát</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#1B3B2B] font-semibold">
                    <ShieldCheck className="w-4 h-4 text-[#C4685A]" />
                    <span>100% Trái cây nhập khẩu tem mác chính hãng</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-[#1B3B2B] font-semibold">
                    <Truck className="w-4 h-4 text-[#5C8A70]" />
                    <span>Giao hỏa tốc 60 - 90 phút hoặc hẹn giờ</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#1B3B2B] font-semibold">
                    <ShieldCheck className="w-4 h-4 text-[#C4685A]" />
                    <span>Gửi ảnh chụp hoa hoàn thiện duyệt trước</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: TRÌNH TÙY BIẾN HOẶC HẠNG MỤC CƯỚI HỎI (7 Cột) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* TRƯỜNG HỢP 1: RẠP CƯỚI HỎI & GIA TIÊN */}
            {isWedding ? (
              <div className="space-y-6">
                
                {/* Hạng mục chi tiết trong gói */}
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#5C8A70]" />
                    <span>Các Hạng Mục Đã Bao Gồm Trong Gói:</span>
                  </h3>
                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8EFEA] space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1B3B2B] pb-2 border-b border-gray-200">
                      <span>🏷️ {quickViewProduct.scale}</span>
                      <span className="text-gray-500 font-normal">⏱️ {quickViewProduct.setupTime}</span>
                    </div>
                    <ul className="space-y-2">
                      {quickViewProduct.includedItems?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                          <Check className="w-4 h-4 text-[#5C8A70] flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4 Bước Quy Trình Phục Vụ */}
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Quy Trình Triển Khai Chuyên Nghiệp:
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                    <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                      <strong className="text-[#1B3B2B] block">1. Khảo sát 0đ</strong>
                      <span>Đo đạc mặt bằng sân & lên phương án</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                      <strong className="text-[#1B3B2B] block">2. Lên Thiết Kế 3D</strong>
                      <span>Duyệt tone màu & chất liệu</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                      <strong className="text-[#1B3B2B] block">3. Thi Công Chuẩn Xác</strong>
                      <span>Hoàn thiện trước giờ đón dâu 6 - 24h</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                      <strong className="text-[#1B3B2B] block">4. Nghiệm Thu & Trực Tiệc</strong>
                      <span>Hỗ trợ kỹ thuật suốt buổi lễ</span>
                    </div>
                  </div>
                </div>

                {/* Form thông tin đặt lịch khảo sát nhanh */}
                <div className="bg-[#F4F7F5] p-4 rounded-2xl border border-[#D1DFD6] space-y-3">
                  <h4 className="text-xs font-bold text-[#1B3B2B] uppercase tracking-wider">
                    Thông Tin Đặt Lịch Khảo Sát Sơ Bộ (Tùy chọn):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Ngày làm lễ dự kiến:
                      </label>
                      <input
                        type="date"
                        value={weddingDate}
                        onChange={(e) => setWeddingDate(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#1B3B2B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Khu vực / Địa chỉ khảo sát:
                      </label>
                      <input
                        type="text"
                        placeholder="VD: P. Tân Lợi, Buôn Ma Thuột..."
                        value={weddingAddress}
                        onChange={(e) => setWeddingAddress(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#1B3B2B]"
                      />
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* TRƯỜNG HỢP 2 & 3: HOA TƯƠI & GIỎ TRÁI CÂY */
              <div className="space-y-6">
                
                {/* 1. Kích cỡ (chỉ dành cho hoa tươi) hoặc Thành phần trái cây (cho giỏ trái cây) */}
                {!isFruit ? (
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
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-[#1B3B2B] bg-[#F4F7F5] ring-2 ring-[#1B3B2B]/20 shadow-xs' 
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
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                      1. Thành Phần Trái Cây Cao Cấp Trong Giỏ:
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-3 bg-[#FAF8F5] rounded-2xl border border-gray-200">
                      {quickViewProduct.fruitTypes?.map((fruit, idx) => (
                        <span key={idx} className="bg-white border border-[#D1DFD6] text-[#1B3B2B] px-3 py-1 rounded-full text-xs font-semibold shadow-xs">
                          ✨ {fruit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Chọn Phong Cách Giấy Gói & Nơ Lụa */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    2. Chọn Tone Màu Giấy Gói & Nơ Ruy Băng:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {WRAPPING_PAPERS.map((wp) => {
                      const isSelected = selectedWrapper.id === wp.id;
                      return (
                        <button
                          key={wp.id}
                          type="button"
                          onClick={() => setSelectedWrapper(wp)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
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
                          className={`flex items-center justify-between gap-2.5 p-3 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                            isChecked 
                              ? 'border-[#C4685A] bg-[#FDF7F6] ring-1 ring-[#C4685A]' 
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-xl shrink-0">{addon.img}</span>
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-gray-800 block leading-snug">{addon.name}</span>
                              <span className="text-gray-500 font-medium block mt-0.5">+{addon.price.toLocaleString('vi-VN')}đ</span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                            isChecked ? 'bg-[#C4685A] border-[#C4685A] text-white' : 'border-gray-300 bg-white'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* Footer Nút Thêm Giỏ Hàng & Báo Giá Zalo */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              {/* Hàng 1: Giá tiền & Kênh tư vấn trực tiếp */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-gray-500 block">
                    {isWedding ? 'Giá trọn gói ước tính:' : 'Tổng thanh toán mẫu này:'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-[#1B3B2B] font-sans">
                      {finalPrice.toLocaleString('vi-VN')}đ
                    </span>
                    {quickViewProduct.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        {quickViewProduct.originalPrice.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                </div>

                {/* Các nút tư vấn nhanh (Zalo & Messenger) */}
                <div className="flex items-center gap-2">
                  {facebookSettings?.isEnabled !== false && (
                    <button
                      type="button"
                      onClick={() => generateMessengerProductInquiry(facebookSettings?.pageId, {
                        name: `${quickViewProduct.name} (${isWedding ? 'Gói Cưới Hỏi' : selectedSize.name})`,
                        price: finalPrice
                      })}
                      className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-[#7B3FE4] border border-purple-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                      title="Tư vấn mẫu này qua Facebook Messenger"
                    >
                      <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.13 2 11.23c0 2.9 1.45 5.49 3.73 7.14v3.52c0 .4.44.66.79.46l3.9-2.14c.51.08 1.04.12 1.58.12 5.52 0 10-4.13 10-9.23S17.52 2 12 2zm1.06 12.35l-2.61-2.79-5.1 2.79 5.61-5.96 2.68 2.79 5.03-2.79-5.61 5.96z"/>
                      </svg>
                      <span>Messenger</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleZaloQuote}
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#0068FF] border border-blue-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                    title={`Nhận báo giá chi tiết qua Zalo (${shopZaloPhone})`}
                  >
                    <ZaloIcon className="w-4 h-4 shrink-0" variant="blue" />
                    <span>Báo Giá Zalo</span>
                  </button>
                </div>
              </div>

              {/* Hàng 2: Nút hành động chính toàn chiều ngang (Full-width Primary CTA) */}
              <div>
                {isWedding ? (
                  <button
                    type="button"
                    onClick={handleZaloQuote}
                    className="w-full bg-[#1B3B2B] hover:bg-[#264A37] text-white text-sm font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Calendar className="w-4 h-4 text-[#F5D6CE] shrink-0" />
                    <span>Đặt Lịch Khảo Sát Tận Nơi 0đ</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full bg-[#1B3B2B] hover:bg-[#264A37] text-white text-sm font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#F5D6CE] shrink-0" />
                    <span>Thêm Vào Giỏ & Đặt Hàng Ngay</span>
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

