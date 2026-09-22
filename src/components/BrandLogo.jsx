import React from 'react';

/**
 * Ngọc Flower - Botanical Atelier Logo Component
 * 
 * Biểu tượng tối giản, thanh lịch chuẩn nhận diện thương hiệu mới:
 * - Đóa hoa 5 cánh bầu dục (5-Petal Botanical Blossom) với đường viền xanh rêu trầm (#1D3E2F)
 * - Nhụy hoa tròn tone san hô ấm áp (#D97769)
 * - Typography cao cấp: "Ngọc" (Deep Pine Green) + "Flower" (Coral Rose)
 * - Tagline: "BOTANICAL ATELIER" giãn cách sang trọng
 */

export const NgocFlowerEmblem = ({ 
  size = 40, 
  className = '', 
  theme = 'dark', // 'dark' (nền sáng) | 'light' (nền tối)
  glow = false 
}) => {
  const isLight = theme === 'light'; // Nền tối -> nét trắng / nhụy san hô sáng
  const strokeColor = isLight ? '#FFFFFF' : '#1D3E2F';
  const centerFill = isLight ? '#E8998D' : '#D97769';
  const petalFill = isLight ? 'transparent' : '#FFFFFF';

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
      <g 
        stroke={strokeColor} 
        strokeWidth="3.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* 5 Cánh hoa bầu dục đối xứng tỏa đều từ tâm (xoay mỗi cánh 72 độ) */}
        <g transform="rotate(0 50 50)">
          <ellipse cx="50" cy="24.5" rx="8" ry="18" fill={petalFill} />
        </g>
        <g transform="rotate(72 50 50)">
          <ellipse cx="50" cy="24.5" rx="8" ry="18" fill={petalFill} />
        </g>
        <g transform="rotate(144 50 50)">
          <ellipse cx="50" cy="24.5" rx="8" ry="18" fill={petalFill} />
        </g>
        <g transform="rotate(216 50 50)">
          <ellipse cx="50" cy="24.5" rx="8" ry="18" fill={petalFill} />
        </g>
        <g transform="rotate(288 50 50)">
          <ellipse cx="50" cy="24.5" rx="8" ry="18" fill={petalFill} />
        </g>

        {/* Nhụy hoa tròn tâm điểm */}
        <circle cx="50" cy="50" r="6.2" fill={centerFill} stroke={strokeColor} strokeWidth="3" />
      </g>
    </svg>
  );
};

/**
 * Component Logo Đầy Đủ (BrandLogo)
 * Hỗ trợ hiển thị: Horizontal (Header/Footer), Stacked (Invoice/Card/Modal), hoặc Icon đơn.
 */
export const BrandLogo = ({
  variant = 'horizontal', // 'horizontal' | 'stacked' | 'icon' | 'image'
  theme = 'dark',         // 'dark' (nền sáng) | 'light' (nền tối) | 'gold'
  size = 'md',            // 'sm' | 'md' | 'lg' | 'xl'
  showTagline = true,
  useImage = false,
  className = ''
}) => {
  // Cỡ icon biểu tượng
  const iconSizes = {
    sm: 32,
    md: 40,
    lg: 50,
    xl: 62
  };

  const emblemSize = iconSizes[size] || 40;

  // Định hình màu sắc theo theme
  const isLight = theme === 'light'; // Nền tối (Footer, Admin modal dark banner)

  const ngocColor = isLight ? 'text-white' : 'text-[#1D3E2F]';
  const flowerColor = isLight ? 'text-[#E8998D]' : 'text-[#D97769]';
  const taglineColor = isLight ? 'text-emerald-200/80' : 'text-[#607D6E]';

  // Hiển thị trực tiếp ảnh PNG gốc nếu yêu cầu (chỉ trên nền sáng)
  if ((variant === 'image' || useImage) && !isLight) {
    const imgHeights = {
      sm: 'h-8',
      md: 'h-10 sm:h-11',
      lg: 'h-12 sm:h-14',
      xl: 'h-16'
    };
    return (
      <img
        src="/logo.png"
        alt="Ngọc Flower Botanical Atelier"
        className={`${imgHeights[size] || 'h-10'} w-auto object-contain select-none ${className}`}
      />
    );
  }

  if (variant === 'icon') {
    return <NgocFlowerEmblem size={emblemSize} theme={theme} className={className} />;
  }

  // Kiểu xếp dọc (Stacked / Centered) - Dùng cho Hóa đơn, Thư cảm ơn, Đăng nhập
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center group ${className}`}>
        <NgocFlowerEmblem size={emblemSize * 1.15} theme={theme} className="mb-2 drop-shadow-xs" />
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-1.5 leading-tight">
            <span className={`font-serif font-black ${ngocColor} ${
              size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : size === 'xl' ? 'text-4xl' : 'text-2xl'
            }`}>
              Ngọc
            </span>
            <span className={`font-serif font-bold italic ${flowerColor} ${
              size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : size === 'xl' ? 'text-4xl' : 'text-2xl'
            }`}>
              Flower
            </span>
          </div>
          {showTagline && (
            <span className={`text-[8px] sm:text-[9px] uppercase font-bold tracking-[0.28em] mt-1 ${taglineColor}`}>
              BOTANICAL ATELIER
            </span>
          )}
        </div>
      </div>
    );
  }

  // Kiểu hàng ngang chuẩn (Horizontal) - Dùng cho Header & Footer Navbar
  return (
    <div className={`flex items-center gap-3 group select-none ${className}`}>
      <NgocFlowerEmblem size={emblemSize} theme={theme} className="drop-shadow-xs" />
      
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className={`font-serif font-black tracking-tight ${ngocColor} ${
            size === 'sm' ? 'text-lg sm:text-xl' : size === 'lg' ? 'text-2xl sm:text-3xl' : size === 'xl' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
          }`}>
            Ngọc
          </span>
          <span className={`font-serif font-bold italic tracking-tight ${flowerColor} ${
            size === 'sm' ? 'text-lg sm:text-xl' : size === 'lg' ? 'text-2xl sm:text-3xl' : size === 'xl' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
          }`}>
            Flower
          </span>
        </div>
        
        {showTagline && (
          <span className={`text-[8px] sm:text-[9px] uppercase font-bold tracking-[0.28em] leading-none mt-1.5 ${taglineColor}`}>
            BOTANICAL ATELIER
          </span>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
