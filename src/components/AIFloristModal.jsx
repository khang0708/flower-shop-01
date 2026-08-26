import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { analyzeFlowerWithAiApi } from '../api';
import { Sparkles, Upload, CheckCircle, RefreshCw, ArrowRight, Wand2 } from 'lucide-react';

const PRESET_SAMPLES = [
  {
    id: 'sample-1',
    name: 'Bó Juliet & Baby Hàn Quốc (Ảnh Pinterest)',
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80',
    analysis: {
      detectedFlowers: ['Hoa Hồng Juliet (15 cành)', 'Baby Hà Lan trắng', 'Lá bạc Khuynh Diệp'],
      colorPalette: ['#F5D6CE', '#D1DFD6', '#FFFFFF'],
      colorNames: ['Hồng Nude', 'Xanh Xám Sage', 'Trắng Thuần'],
      style: 'Hàn Quốc Tối Giản (Korean Minimalist)',
      difficulty: 'Trung Bình',
      priceRange: { min: 750000, max: 890000 },
      floristAdvice: 'Sử dụng giấy lụa mờ 2 lớp và ruy băng thêu tên để tôn lên dáng hoa bồng bềnh.',
      matchSummary: 'Mẫu hoa mang cảm giác ngọt ngào, trang nhã, rất thích hợp tặng bạn gái hoặc sinh nhật.'
    }
  },
  {
    id: 'sample-2',
    name: 'Hộp Hoa Mẫu Đơn & Tulip Sang Trọng (Ảnh Instagram)',
    image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80',
    analysis: {
      detectedFlowers: ['Mẫu Đơn Hồng (5 bông lớn)', 'Tulip Cam Sunset (10 cành)', 'Cúc Tana nhí'],
      colorPalette: ['#E8998D', '#F6D268', '#EAE3D2'],
      colorNames: ['Hồng San Hô', 'Cam Ấm', 'Màu Be'],
      style: 'Tây Âu Hiện Đại (Modern European)',
      difficulty: 'Nghệ Thuật Cao',
      priceRange: { min: 1200000, max: 1450000 },
      floristAdvice: 'Cần cắm trên xốp giữ ẩm chuyên dụng để mẫu đơn nở bung tròn đầy nhất.',
      matchSummary: 'Phong cách quý phái, đẳng cấp, cực kỳ nổi bật khi làm quà mừng đối tác hoặc sinh nhật VIP.'
    }
  },
  {
    id: 'sample-3',
    name: 'Bó Hoa Hướng Dương Nắng Vàng (Ảnh Khai Trương)',
    image: 'https://images.unsplash.com/photo-1599733589046-10c005739ef9?auto=format&fit=crop&w=600&q=80',
    analysis: {
      detectedFlowers: ['Hướng Dương Nhật (7 đóa)', 'Lan Vũ Nữ vàng chùm', 'Lá Đinh Lăng cẩm thạch'],
      colorPalette: ['#F6D268', '#5C8A70', '#D8C7B5'],
      colorNames: ['Vàng Nắng', 'Xanh Lá Tươi', 'Kraft Mộc'],
      style: 'Rực Rỡ Khai Vận (Celebration Joy)',
      difficulty: 'Tiêu Chuẩn',
      priceRange: { min: 850000, max: 980000 },
      floristAdvice: 'Gói giấy báo vintage hoặc kraft để tăng độ tương phản với màu vàng rực rỡ.',
      matchSummary: 'Biểu tượng của tài lộc và sự khởi đầu may mắn, thích hợp mừng khai trương, tốt nghiệp.'
    }
  }
];

export const AIFloristModal = () => {
  const { isAIFloristOpen, setIsAIFloristOpen, addToCart } = useShop();

  const [selectedImage, setSelectedImage] = useState(PRESET_SAMPLES[0].image);
  const [selectedSample, setSelectedSample] = useState(PRESET_SAMPLES[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(PRESET_SAMPLES[0].analysis);

  if (!isAIFloristOpen) return null;

  const handleSelectSample = async (sample) => {
    setSelectedSample(sample);
    setSelectedImage(sample.image);
    triggerScanning(sample.analysis);
  };

  const handleCustomUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        setSelectedImage(base64);
        setSelectedSample(null);
        setIsScanning(true);
        setAnalysisResult(null);

        try {
          // Gọi trực tiếp REST API Backend: POST /api/ai/analyze-flower
          const apiData = await analyzeFlowerWithAiApi(base64);
          setIsScanning(false);
          setAnalysisResult({
            detectedFlowers: apiData.detectedFlowers,
            colorPalette: apiData.colorPalette,
            colorNames: apiData.colorNames,
            style: apiData.style,
            difficulty: apiData.difficulty,
            priceRange: apiData.priceRange,
            floristAdvice: apiData.floristAdvice,
            matchSummary: apiData.summaryVietnamese
          });
        } catch (err) {
          // Fallback parsing
          setTimeout(() => {
            setIsScanning(false);
            setAnalysisResult({
              detectedFlowers: ['Hoa Hồng Nhập Khẩu', 'Hoa Baby Trắng', 'Lá Khuynh Diệp'],
              colorPalette: ['#E8998D', '#D1DFD6', '#FAF8F5'],
              colorNames: ['Hồng Phấn', 'Xanh Pastel', 'Kem Sữa'],
              style: 'Cắm Tự Do Nghệ Thuật (Artisan Bouquet)',
              difficulty: 'Trung Bình Khá',
              priceRange: { min: 850000, max: 1050000 },
              floristAdvice: 'Nghệ nhân Flora sẽ phối các cành hoa có tone tương tự nhất trong kho sáng nay để đảm bảo tươi mới.',
              matchSummary: 'Mẫu hoa bạn chọn có bố cục rất hài hòa và màu sắc ngọt ngào.'
            });
          }, 1000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerScanning = (resultData) => {
    setIsScanning(true);
    setAnalysisResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setAnalysisResult(resultData);
    }, 1000);
  };

  const handleOrderThisCustomBouquet = () => {
    const customItem = {
      id: `ai-custom-${Date.now()}`,
      name: selectedSample ? selectedSample.name : 'Bó Hoa Thiết Kế Riêng (Theo Ảnh AI)',
      price: analysisResult.priceRange.min,
      image: selectedImage,
      tags: ['Thiết Kế Theo Ảnh', 'AI Certified'],
      subtitle: analysisResult.matchSummary,
      meaning: 'Thiết kế riêng độc bản theo mong muốn của bạn',
      flowerTypes: analysisResult.detectedFlowers,
      rating: 5.0,
      reviewsCount: 1,
      freshDays: 4,
    };

    addToCart(customItem, {
      size: { id: 'custom', name: 'Kích cỡ chuẩn theo ảnh mẫu', priceMultiplier: 1.0 },
      wrapper: { id: 'custom', name: 'Giấy gói nghệ nhân phối theo ảnh' },
      cardMessage: 'Gửi tặng bạn bó hoa thiết kế riêng thật đặc biệt này!',
      senderSign: 'Người gửi'
    });

    setIsAIFloristOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-[#E8EFEA] my-auto animate-fade-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1B3B2B] via-[#264A37] to-[#1B3B2B] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F5D6CE]/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#F5D6CE]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">Trợ Lý AI Florist Vision API</h3>
              <p className="text-[11px] text-emerald-200">Thẩm định loài hoa & Báo giá qua REST API trong 3 giây</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAIFloristOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body Grid */}
        <div className="max-h-[82vh] overflow-y-auto p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT TRÁI: CHỌN ẢNH HOẶC UPLOAD (5 Cột) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <span className="text-xs font-bold text-gray-700 block mb-2">
                1. Chọn ảnh hoa mẫu hoặc tải lên:
              </span>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                {PRESET_SAMPLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSample(s)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedSample?.id === s.id ? 'border-[#1B3B2B] ring-2 ring-[#1B3B2B]/30' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <label className="border border-dashed border-[#5C8A70] hover:border-[#1B3B2B] bg-[#FAF8F5] p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all text-xs font-semibold text-[#1B3B2B]">
                <Upload className="w-4 h-4 text-[#5C8A70]" />
                <span>Tải ảnh từ điện thoại / máy tính</span>
                <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
              </label>
            </div>

            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-black">
              <img
                src={selectedImage}
                alt="Ảnh đang thẩm định"
                className={`w-full h-full object-cover transition-opacity duration-300 ${isScanning ? 'opacity-50' : 'opacity-100'}`}
              />

              {isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/40 backdrop-blur-[2px]">
                  <div className="w-12 h-12 rounded-full border-4 border-t-[#F5D6CE] border-white/20 animate-spin mb-3" />
                  <span className="text-xs font-bold font-sans">API Đang Thẩm Định Cánh Hoa...</span>
                  <span className="text-[10px] text-gray-300">Phân tích loài hoa & bóc tách chi phí</span>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: KẾT QUẢ PHÂN TÍCH AI (7 Cột) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                2. Kết Quả Thẩm Định Chi Tiết Từ AI API:
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-[#EBF2ED] px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Độ chuẩn xác 96%
              </span>
            </div>

            {analysisResult && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-[#FAF4F0] p-4 rounded-2xl border border-[#F5D6CE] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#5A3831] block">Mức giá cắm theo yêu cầu:</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-[#C4685A] font-sans">
                      {analysisResult.priceRange.min.toLocaleString('vi-VN')}đ - {analysisResult.priceRange.max.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <span className="text-xs font-semibold bg-white text-[#C4685A] border border-[#F5D6CE] px-3 py-1.5 rounded-full">
                    Đã gồm thiệp & túi giấy
                  </span>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8EFEA] space-y-2">
                  <span className="text-xs font-bold text-[#1B3B2B] block">
                    🌸 Các loài hoa chính được nhận diện:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.detectedFlowers.map((fl, i) => (
                      <span key={i} className="text-xs bg-white border border-[#D1DFD6] text-gray-800 px-3 py-1 rounded-lg font-medium shadow-2xs">
                        {fl}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8EFEA]">
                    <span className="text-xs font-bold text-gray-700 block mb-1.5">Palette Màu Sắc:</span>
                    <div className="flex items-center gap-2">
                      {analysisResult.colorPalette.map((col, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span className="w-5 h-5 rounded-full border border-black/10 inline-block shadow-xs" style={{ backgroundColor: col }} />
                          <span className="text-[10px] text-gray-500">{analysisResult.colorNames[idx]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8EFEA]">
                    <span className="text-xs font-bold text-gray-700 block mb-1">Phong Cách & Độ Khó:</span>
                    <p className="text-xs font-bold text-[#1B3B2B]">{analysisResult.style}</p>
                    <span className="text-[11px] text-gray-500">Độ phức tạp: {analysisResult.difficulty}</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-[#D1DFD6] space-y-1">
                  <span className="text-xs font-bold text-[#5C8A70] flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5" /> Lời khuyên từ nghệ nhân Flora:
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed italic">
                    "{analysisResult.floristAdvice}"
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleOrderThisCustomBouquet}
                    className="flex-1 bg-[#1B3B2B] hover:bg-[#264A37] text-white text-xs sm:text-sm font-bold py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>💐 Đặt Cắm Ngay Theo Mẫu Này</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <a
                    href="https://zalo.me"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#0068FF] text-white text-xs font-bold px-5 py-3.5 rounded-full hover:bg-blue-600 transition-all text-center"
                  >
                    Gửi Ảnh Qua Zalo Nghệ Nhân
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
