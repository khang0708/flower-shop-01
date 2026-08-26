import React, { useState } from 'react';
import { 
  Star, 
  CheckCircle, 
  MessageSquareHeart, 
  Camera, 
  ThumbsUp, 
  Sparkles, 
  Plus, 
  Filter,
  X,
  Send,
  HeartHandshake
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ReviewsSection = () => {
  const { reviews, addReview, products } = useShop();
  
  const [filterType, setFilterType] = useState('all'); // 'all' | 'with_photo' | '5_star'
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formOccasion, setFormOccasion] = useState('Sinh Nhật');
  const [formProductName, setFormProductName] = useState(products[0]?.name || 'Bó Hoa Juliet Nắng Ban Mai');
  const [formComment, setFormComment] = useState('');
  const [formImage, setFormImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Lọc đánh giá
  const visibleReviews = reviews.filter(r => r.isVisible !== false);
  const filteredReviews = visibleReviews.filter(r => {
    if (filterType === 'with_photo') return Boolean(r.proofImage);
    if (filterType === '5_star') return r.rating === 5;
    return true;
  });

  const averageRating = visibleReviews.length > 0
    ? (visibleReviews.reduce((sum, r) => sum + r.rating, 0) / visibleReviews.length).toFixed(1)
    : '5.0';

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addReview({
        customerName: formName || 'Khách hàng Flora',
        rating: Number(formRating),
        occasion: formOccasion,
        productName: formProductName,
        comment: formComment,
        proofImage: formImage || null,
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsWriteModalOpen(false);
        setFormComment('');
        setFormImage('');
      }, 1500);
    } catch (err) {
      alert('Không thể gửi đánh giá: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="reviews-section" className="py-16 bg-[#FAF8F5] border-t border-[#E8EFEA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF2ED] text-[#1B3B2B] text-xs font-bold mb-3">
              <MessageSquareHeart className="w-3.5 h-3.5 text-[#5C8A70]" />
              <span>Feedback Thực Tế Từ Người Nhận Hoa</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1B3B2B] tracking-tight">
              Cảm Xúc & Đánh Giá Của Khách Hàng
            </h2>
            <p className="text-sm text-gray-600 mt-2 max-w-xl">
              100% hình ảnh và phản hồi được gửi trực tiếp từ người nhận và người đặt hoa sau mỗi chuyến giao bất ngờ.
            </p>
          </div>

          {/* Action CTA & Rating Badge */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-white px-4 py-3 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
              <div className="text-center border-r border-gray-100 pr-3">
                <span className="text-2xl font-serif font-extrabold text-[#1B3B2B] leading-none block">{averageRating}</span>
                <span className="text-[10px] text-gray-400 font-medium">/ 5.0 sao</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex text-amber-400 text-xs">
                  {'★★★★★'.split('').map((s, i) => (
                    <span key={i}>{s}</span>
                  ))}
                </div>
                <span className="text-[11px] text-gray-500 font-semibold block">
                  {visibleReviews.length} Đánh giá đã xác thực
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="bg-[#1B3B2B] hover:bg-[#264A37] text-white font-bold text-xs px-5 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#F5D6CE]" />
              <span>✍️ Viết Đánh Giá Của Bạn</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-bold text-gray-600 mr-1">Bộ lọc:</span>
          {[
            { id: 'all', label: `Tất Cả (${visibleReviews.length})` },
            { id: 'with_photo', label: '📸 Có Ảnh Chụp Thật' },
            { id: '5_star', label: '⭐ Đánh Giá 5 Sao' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                filterType === f.id
                  ? 'bg-[#1B3B2B] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid Reviews Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((rev) => (
            <div 
              key={rev.id} 
              className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header User */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={rev.customerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                      alt={rev.customerName}
                      className="w-10 h-10 rounded-full object-cover border border-emerald-100" 
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="font-serif text-sm font-bold text-[#1B3B2B]">{rev.customerName}</strong>
                        {rev.verified && (
                          <span title="Đã xác thực đơn mua hàng thật">
                            <CheckCircle className="w-3.5 h-3.5 text-[#5C8A70]" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 block">{rev.createdAt}</span>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex text-amber-400 text-xs">
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Tags Mẫu hoa & Dịp */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-[#FAF4F0] text-[#C4685A] font-bold px-2.5 py-0.5 rounded-md">
                    💐 {rev.productName}
                  </span>
                  {rev.occasion && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-md">
                      Dịp: {rev.occasion}
                    </span>
                  )}
                </div>

                {/* Comment */}
                <p className="text-xs text-gray-700 leading-relaxed italic">
                  "{rev.comment}"
                </p>

                {/* Ảnh chụp hoa thực tế */}
                {rev.proofImage && (
                  <div 
                    onClick={() => setSelectedPhotoModal(rev.proofImage)}
                    className="relative group cursor-pointer aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 mt-2"
                  >
                    <img 
                      src={rev.proofImage} 
                      alt="Ảnh feedback thực tế" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                      <Camera className="w-4 h-4" />
                      <span>Xem ảnh lớn</span>
                    </div>
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full font-medium backdrop-blur-xs">
                      📸 Ảnh hoa giao thực tế
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1 text-[#5C8A70] font-semibold text-[11px]">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  Đã nhận hoa tươi tận tay
                </span>
                <span className="flex items-center gap-1 text-gray-500 text-[11px]">
                  <ThumbsUp className="w-3 h-3 text-gray-400" />
                  {rev.likes || 1} hữu ích
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* MODAL GỬI ĐÁNH GIÁ MỚI */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-gray-200 animate-fade-in my-auto">
            <div className="bg-[#1B3B2B] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">✍️</span>
                <h3 className="font-serif text-lg font-bold">Gửi Cảm Nhận & Đánh Giá Hoa</h3>
              </div>
              <button 
                onClick={() => setIsWriteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-base transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs text-[#222523]">
              
              {/* Rating stars picker */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8EFEA] text-center space-y-2">
                <span className="text-xs font-bold text-[#1B3B2B] block">Mức độ hài lòng của bạn:</span>
                <div className="flex justify-center gap-2 text-2xl cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className={`transition-transform hover:scale-125 ${
                        star <= formRating ? 'text-amber-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-emerald-800 font-semibold block">
                  {formRating === 5 ? 'Tuyệt vời, hoa rất tươi & đúng hẹn!' : `${formRating} / 5 sao`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Họ tên của bạn *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Chị Minh Thư"
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1B3B2B]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Dịp gửi tặng hoa</label>
                  <input
                    type="text"
                    value={formOccasion}
                    onChange={(e) => setFormOccasion(e.target.value)}
                    placeholder="VD: Sinh nhật / Kỷ niệm"
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1B3B2B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mẫu hoa bạn đã nhận / gửi tặng *</label>
                <select
                  value={formProductName}
                  onChange={(e) => setFormProductName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none bg-white font-medium"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Cảm nghĩ về bó hoa & dịch vụ giao *</label>
                <textarea
                  rows={3}
                  required
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Hoa có tươi không? Thiệp viết có đẹp không? Bạn nhận hoa có bất ngờ không?..."
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1B3B2B]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Ảnh chụp bó hoa thực tế (URL ảnh)</label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/... hoặc link ảnh"
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1B3B2B]"
                />
              </div>

              {submitSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Cảm ơn bạn! Đánh giá đã được gửi lên hệ thống Flora & Bloom.</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#1B3B2B] hover:bg-[#264A37] disabled:opacity-50 text-white font-bold py-3 rounded-full shadow-md flex items-center justify-center gap-2 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang gửi...' : 'Đăng Đánh Giá'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-full"
                >
                  Đóng
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL ZOOM XEM ẢNH LỚN */}
      {selectedPhotoModal && (
        <div 
          onClick={() => setSelectedPhotoModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fade-in"
        >
          <div className="relative max-w-2xl w-full bg-transparent">
            <img 
              src={selectedPhotoModal} 
              alt="Zoomed review proof" 
              className="w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl border-2 border-white/20"
            />
            <button 
              onClick={() => setSelectedPhotoModal(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-black font-bold flex items-center justify-center shadow-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </section>
  );
};
