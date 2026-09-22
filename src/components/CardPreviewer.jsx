import React, { useState } from 'react';
import { AI_GREETING_TEMPLATES } from '../data/aiTemplates';
import { Sparkles, Edit3, Heart, RefreshCw } from 'lucide-react';

export const CardPreviewer = ({ 
  cardMessage, 
  setCardMessage, 
  senderSign, 
  setSenderSign, 
  currentOccasion = 'love' 
}) => {
  const [activeCategory, setActiveCategory] = useState(currentOccasion in AI_GREETING_TEMPLATES ? currentOccasion : 'love');
  
  const templates = AI_GREETING_TEMPLATES[activeCategory] || AI_GREETING_TEMPLATES.love;

  return (
    <div className="bg-[#FAF8F5] p-5 sm:p-6 rounded-2xl border border-[#F5D6CE]/80 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">💌</span>
          <h4 className="font-serif text-base sm:text-lg font-bold text-[#1B3B2B]">
            Thiệp Tặng Kèm Thủ Công (Miễn Phí)
          </h4>
        </div>
        <span className="text-[11px] bg-[#EBF2ED] text-[#1B3B2B] font-semibold px-2.5 py-0.5 rounded-full">
          In mực nghệ thuật
        </span>
      </div>

      {/* AI Suggestion Pills */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C4685A]" />
            Gợi ý lời chúc AI theo dịp:
          </span>
          <div className="flex gap-1">
            {['love', 'birthday', 'opening', 'thanks'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-medium capitalize transition-all ${
                  activeCategory === cat 
                    ? 'bg-[#1B3B2B] text-white' 
                    : 'bg-white text-gray-500 hover:bg-gray-100'
                }`}
              >
                {cat === 'love' ? 'Tình yêu' : cat === 'birthday' ? 'Sinh nhật' : cat === 'opening' ? 'Khai trương' : 'Tri ân'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {templates.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCardMessage(tpl.text)}
              className="text-left p-2 bg-white hover:bg-[#FAF4F0] border border-[#E8EFEA] hover:border-[#E8998D] rounded-xl text-[11px] text-gray-700 transition-all leading-snug group"
            >
              <span className="font-bold text-[#C4685A] block mb-0.5 text-[10px]">
                ✦ {tpl.tone}
              </span>
              <span className="line-clamp-2 text-gray-600 group-hover:text-gray-900">
                "{tpl.text}"
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Textarea Lời Chúc */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-700">
          Nội dung lời chúc trên thiệp:
        </label>
        <textarea
          rows={3}
          value={cardMessage}
          onChange={(e) => setCardMessage(e.target.value)}
          maxLength={250}
          placeholder="Nhập lời chúc bạn muốn gửi trao..."
          className="w-full p-3 rounded-xl border border-[#D1DFD6] text-xs focus:outline-none focus:border-[#1B3B2B] focus:ring-1 focus:ring-[#1B3B2B] bg-white transition-all"
        />
        <div className="flex justify-between text-[11px] text-gray-400">
          <span>Tối đa 250 ký tự</span>
          <span>{cardMessage.length}/250</span>
        </div>
      </div>

      {/* Tên Ký Tặng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Chữ ký người gửi (Trên thiệp):
          </label>
          <input
            type="text"
            value={senderSign}
            onChange={(e) => setSenderSign(e.target.value)}
            placeholder="VD: Từ một người luôn thương em / Bạn thân"
            className="w-full p-2.5 rounded-xl border border-[#D1DFD6] text-xs focus:outline-none focus:border-[#1B3B2B] bg-white"
          />
        </div>
      </div>

      {/* LIVE HANDWRITING PREVIEW CARD */}
      <div className="mt-4 pt-3 border-t border-[#F5D6CE]/60">
        <span className="text-[11px] font-bold text-gray-500 block mb-2">
          👁️ Xem trước tấm thiệp thực tế sẽ gửi kèm hoa:
        </span>
        
        <div className="p-6 bg-[#FFFDF9] rounded-2xl border-2 border-dashed border-[#E8998D] shadow-sm relative overflow-hidden">
          {/* Watermark Logo */}
          <div className="absolute -right-4 -bottom-4 text-[#F5D6CE]/40 font-serif text-6xl select-none pointer-events-none italic">
            Ngọc Flower
          </div>

          <div className="text-center font-script text-xl sm:text-2xl text-[#1B3B2B] leading-relaxed min-h-[60px] flex items-center justify-center">
            "{cardMessage || 'Lời chúc của bạn sẽ được in nghệ thuật tại đây...'}"
          </div>

          <div className="text-right mt-4 text-xs font-serif font-semibold text-[#C4685A]">
            — {senderSign || 'Người gửi tặng'}
          </div>
        </div>
      </div>

    </div>
  );
};
