import React from 'react';

/**
 * Ngọc Flower - Luxury Artisan Botanical Logo Component
 * 
 * Biểu tượng kết hợp giữa:
 * - Đóa hoa nở rộ đa tầng (Botanical Blossom): mềm mại, sống động, tinh khiết
 * - Viên ngọc quý đa giác tỏa sáng (Brilliant Gem / Diamond Facet): sang trọng, cao quý, độc bản
 * - Vòng nguyệt quế / Medallion hoàng gia: định vị tiệm hoa thủ công nghệ thuật cao cấp
 */

export const NgocFlowerEmblem = ({ size = 42, className = '', glow = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Gradient Vàng Hoàng Gia / Champagne Gold */}
        <linearGradient id="ngocGoldLinear" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFBA73" />
          <stop offset="25%" stopColor="#F7E5B5" />
          <stop offset="50%" stopColor="#C59B46" />
          <stop offset="75%" stopColor="#F9EDB8" />
          <stop offset="100%" stopColor="#9B7328" />
        </linearGradient>

        {/* Gradient Xanh Ngọc Bích / Deep Jade Emerald */}
        <linearGradient id="ngocJadeLinear" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2E654C" />
          <stop offset="50%" stopColor="#1B3B2B" />
          <stop offset="100%" stopColor="#0F241A" />
        </linearGradient>

        {/* Gradient Ánh Hồng Phấn / Blushing Flora */}
        <linearGradient id="ngocRoseLinear" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5D6CE" />
          <stop offset="50%" stopColor="#E8998D" />
          <stop offset="100%" stopColor="#C4685A" />
        </linearGradient>

        {/* Radial Glow cho tâm viên ngọc */}
        <radialGradient id="ngocGemGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#F7E5B5" stopOpacity="0.7" />
          <stop offset="70%" stopColor="#DFBA73" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#DFBA73" stopOpacity="0" />
        </radialGradient>

        {/* Drop Shadow nhẹ chuẩn Luxury */}
        <filter id="luxuryShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F241A" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* 1. VÒNG HUY HIỆU HOÀNG GIA (LUXURY MEDALLION FRAME) */}
      <g filter="url(#luxuryShadow)">
        {/* Vòng ngoài thanh mảnh */}
        <circle
          cx="50"
          cy="50"
          r="46.5"
          stroke="url(#ngocGoldLinear)"
          strokeWidth="0.85"
          strokeOpacity="0.85"
        />

        {/* Vòng hạt ngọc viền trong (Dotted Pearl Ring) */}
        <circle
          cx="50"
          cy="50"
          r="44"
          stroke="url(#ngocGoldLinear)"
          strokeWidth="0.6"
          strokeDasharray="1.2 3.2"
          strokeOpacity="0.7"
        />

        {/* 4 Hạt Ngọc Đính 4 Hướng (Cardinal Gem Pip Accents) */}
        <path d="M50 1.5 L52 3.5 L50 5.5 L48 3.5 Z" fill="url(#ngocGoldLinear)" />
        <path d="M50 94.5 L52 96.5 L50 98.5 L48 96.5 Z" fill="url(#ngocGoldLinear)" />
        <path d="M1.5 50 L3.5 48 L5.5 50 L3.5 52 Z" fill="url(#ngocGoldLinear)" />
        <path d="M94.5 50 L96.5 48 L98.5 50 L96.5 52 Z" fill="url(#ngocGoldLinear)" />

        {/* 4 Điểm phụ nhỏ (Ordinal mini dots) */}
        <circle cx="17.5" cy="17.5" r="0.9" fill="url(#ngocGoldLinear)" opacity="0.6" />
        <circle cx="82.5" cy="17.5" r="0.9" fill="url(#ngocGoldLinear)" opacity="0.6" />
        <circle cx="17.5" cy="82.5" r="0.9" fill="url(#ngocGoldLinear)" opacity="0.6" />
        <circle cx="82.5" cy="82.5" r="0.9" fill="url(#ngocGoldLinear)" opacity="0.6" />
      </g>

      {/* 2. CÁNH HOA ĐA TẦNG NỞ RỘ (BLOOMING ARTISAN PETALS) */}
      <g stroke="url(#ngocGoldLinear)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Tầng cánh chéo (Diagonal Petal Wings - X) */}
        <path
          d="M50 50 C62 38 72 26 78 22 C74 28 62 38 50 50 Z"
          fill="url(#ngocJadeLinear)"
          fillOpacity="0.35"
        />
        <path
          d="M50 50 C38 38 28 26 22 22 C26 28 38 38 50 50 Z"
          fill="url(#ngocJadeLinear)"
          fillOpacity="0.35"
        />
        <path
          d="M50 50 C38 62 28 72 22 78 C26 72 38 62 50 50 Z"
          fill="url(#ngocJadeLinear)"
          fillOpacity="0.35"
        />
        <path
          d="M50 50 C62 62 72 72 78 78 C72 72 62 62 50 50 Z"
          fill="url(#ngocJadeLinear)"
          fillOpacity="0.35"
        />

        {/* 4 Cánh hoa chính vươn dáng (Major Organic Petals - Thượng, Hạ, Tả, Hữu) */}
        {/* Cánh Đỉnh (Top Petal) */}
        <path
          d="M50 11 C41 24 43 38 50 48 C57 38 59 24 50 11 Z"
          fill="url(#ngocJadeLinear)"
          fillOpacity="0.65"
        />
        {/* Cánh Đáy (Bottom Petal) */}
        <path
          d="M50 89 C41 76 43 62 50 52 C57 62 59 76 50 89 Z"
          fill="url(#ngocJadeLinear)"
          fillOpacity="0.65"
        />
        {/* Cánh Trái (Left Petal) */}
        <path
          d="M11 50 C24 41 38 43 48 50 C38 57 24 59 11 50 Z"
          fill="url(#ngocJadeLinear)"
          fillOpacity="0.65"
        />
        {/* Cánh Phải (Right Petal) */}
        <path
          d="M89 50 C76 41 62 43 52 50 C62 57 76 59 89 50 Z"
          fill="url(#ngocJadeLinear)"
          fillOpacity="0.65"
        />

        {/* Gân hoa mềm mại (Delicate petal veins) */}
        <path d="M50 18 L50 44" stroke="url(#ngocGoldLinear)" strokeWidth="0.75" opacity="0.8" />
        <path d="M50 82 L50 56" stroke="url(#ngocGoldLinear)" strokeWidth="0.75" opacity="0.8" />
        <path d="M18 50 L44 50" stroke="url(#ngocGoldLinear)" strokeWidth="0.75" opacity="0.8" />
        <path d="M82 50 L56 50" stroke="url(#ngocGoldLinear)" strokeWidth="0.75" opacity="0.8" />
      </g>

      {/* 3. TÂM VIÊN NGỌC QUÝ TỎA SÁNG (THE RADIANT GEM & BRILLIANT STAR) */}
      <g>
        {/* Vầng sáng tâm */}
        <circle cx="50" cy="50" r="14" fill="url(#ngocGemGlow)" />

        {/* Đa giác giác cắt kim cương / Ngọc lục bảo (Emerald Cut Facet) */}
        <polygon
          points="50,34 61,39 66,50 61,61 50,66 39,61 34,50 39,39"
          fill="url(#ngocJadeLinear)"
          stroke="url(#ngocGoldLinear)"
          strokeWidth="1"
        />

        {/* Ngôi sao lấp lánh 8 cánh (8-Point Radiance Starburst) */}
        <path
          d="M50 36 Q50 50 64 50 Q50 50 50 64 Q50 50 36 50 Q50 50 50 36 Z"
          fill="url(#ngocGoldLinear)"
        />

        {/* 4 Tia sáng chéo vi lượng */}
        <path
          d="M50 50 L58 42 M50 50 L42 42 M50 50 L42 58 M50 50 L58 58"
          stroke="url(#ngocGoldLinear)"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* Tâm điểm ngọc tinh khiết (Pure Diamond Core) */}
        <circle cx="50" cy="50" r="2.2" fill="#FFFFFF" />
        <circle cx="50" cy="50" r="1" fill="#FDFBF7" />
      </g>
    </svg>
  );
};

/**
 * Component Logo Đầy Đủ (BrandLogo)
 * Linh hoạt hiển thị: Horizontal (Header/Footer), Stacked (Invoice/Card/Modal), hoặc Icon đơn.
 */
export const BrandLogo = ({
  variant = 'horizontal', // 'horizontal' | 'stacked' | 'icon'
  theme = 'dark',         // 'dark' (nền sáng) | 'light' (nền tối) | 'gold'
  size = 'md',            // 'sm' | 'md' | 'lg' | 'xl'
  showTagline = true,
  className = ''
}) => {
  // Cỡ icon biểu tượng
  const iconSizes = {
    sm: 34,
    md: 44,
    lg: 54,
    xl: 68
  };

  const emblemSize = iconSizes[size] || 44;

  // Định hình màu sắc theo theme
  const isLight = theme === 'light'; // Nền tối (Footer, Admin modal dark banner)
  const isGold = theme === 'gold';

  const brandNameClasses = isLight
    ? 'text-white'
    : isGold
    ? 'text-[#C59B46]'
    : 'text-[#1B3B2B]';

  const taglineClasses = isLight
    ? 'text-[#E8998D]'
    : isGold
    ? 'text-[#DFBA73]'
    : 'text-[#C4685A]';

  const sublineClasses = isLight
    ? 'text-emerald-200/70'
    : 'text-gray-400';

  if (variant === 'icon') {
    return <NgocFlowerEmblem size={emblemSize} className={className} />;
  }

  // Kiểu xếp dọc (Stacked / Centered) - Dùng cho Hóa đơn, Thư cảm ơn, Đăng nhập
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center group ${className}`}>
        <NgocFlowerEmblem size={emblemSize * 1.15} className="mb-2.5 drop-shadow-sm" />
        <div className="flex flex-col items-center">
          <span className={`font-serif tracking-tight font-bold ${brandNameClasses} ${
            size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : size === 'xl' ? 'text-4xl' : 'text-2xl'
          } leading-tight`}>
            Ngọc Flower
          </span>
          {showTagline && (
            <span className={`text-[9px] sm:text-[10px] uppercase font-medium tracking-[0.3em] mt-1 ${taglineClasses}`}>
              Tiệm Hoa Tươi Nghệ Thuật
            </span>
          )}
          <span className={`text-[8px] uppercase tracking-[0.25em] font-light mt-0.5 ${sublineClasses}`}>
            Buôn Ma Thuột • Est. 2026
          </span>
        </div>
      </div>
    );
  }

  // Kiểu hàng ngang chuẩn (Horizontal) - Dùng cho Header & Footer Navbar
  return (
    <div className={`flex items-center gap-3 group select-none ${className}`}>
      <NgocFlowerEmblem size={emblemSize} className="drop-shadow-xs" />
      
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-serif font-bold tracking-tight leading-none ${brandNameClasses} ${
            size === 'sm' ? 'text-lg sm:text-xl' : size === 'lg' ? 'text-2xl sm:text-3xl' : size === 'xl' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
          }`}>
            Ngọc Flower
          </span>
        </div>
        
        {showTagline && (
          <span className={`text-[8.5px] sm:text-[9.5px] uppercase font-semibold tracking-[0.25em] leading-none mt-1 ${taglineClasses}`}>
            Tiệm Hoa Tươi Nghệ Thuật
          </span>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
