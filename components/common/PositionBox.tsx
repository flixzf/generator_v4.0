import React from 'react';

// ---------------------------
// **직책 박스 컴포넌트 (PositionBox)**
// ---------------------------
export const PositionBox: React.FC<{
  title: string;
  subtitle?: string;
  level: number;
  className?: string;
  colorCategory?: 'direct' | 'indirect' | 'OH';
}> = ({ title, subtitle, level, className = '', colorCategory }) => {
  let baseClassName = `
    w-40 h-16
    border border-gray-300 rounded
    flex flex-col justify-center items-center m-2
  `;
  
  // 새로운 색상 체계 적용
  if (colorCategory) {
    if (colorCategory === 'OH') {
      baseClassName += " bg-gray-400 border-gray-500 text-black"; // 가장 진한 색상 (기존 GL 색상)
    } else if (colorCategory === 'indirect') {
      baseClassName += " bg-gray-200 border-gray-400 text-black"; // 중간 색상
    } else if (colorCategory === 'direct') {
      baseClassName += " bg-gray-50 border-gray-300 text-black"; // 가장 옅은 색상
    }
  } else {
    // 기존 level 기반 색상 (하위 호환성을 위해 유지)
    if (level === 0) baseClassName += " bg-gray-700 text-white border-gray-500";
    else if (level === 1) baseClassName += " bg-gray-500 text-white border-gray-700";
    else if (level === 2) baseClassName += " bg-gray-400 border-gray-500";
    else if (level === 3) baseClassName += " bg-gray-300 border-gray-500";
    else baseClassName += " bg-blue-50 border-gray-500";
  }

  return (
    <div className={`${baseClassName} ${className}`}>
      <div className="text-center">
        <div className="font-bold">{title}</div>
        {subtitle && <div className="text-sm">{subtitle}</div>}
      </div>
    </div>
  );
};