"use client";
import React, { useState, useRef, useEffect } from "react";

// ---------------------------
// **PositionBox 데이터 인터페이스**
// ---------------------------
export interface PositionData {
  id: string;
  title: string;
  subtitle?: string;
  level: number;
  colorCategory?: 'direct' | 'indirect' | 'OH';
  // 추가 정보
  manpower?: number;
  department?: string;
  lineIndex?: number;
  processName?: string;
  shiftInfo?: string;
  responsibilities?: string[];
  skills?: string[];
  workload?: number;
  efficiency?: number;
  // 모델 관련 정보
  modelId?: string;
  processId?: string;
  // 상태 정보
  status?: 'active' | 'inactive' | 'planning';
  isSelected?: boolean;
  isHighlighted?: boolean;
  // 좌표 정보 추가
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
    // 앵커 포인트들
    anchors?: {
      topLeft: { x: number; y: number };
      topCenter: { x: number; y: number };
      topRight: { x: number; y: number };
      centerLeft: { x: number; y: number };
      center: { x: number; y: number };
      centerRight: { x: number; y: number };
      bottomLeft: { x: number; y: number };
      bottomCenter: { x: number; y: number };
      bottomRight: { x: number; y: number };
    };
  };
  // 드래그 관련
  isDraggable?: boolean;
  isDragging?: boolean;
}

export interface InteractivePositionBoxProps {
  data: PositionData;
  className?: string;
  onClick?: (data: PositionData) => void;
  onHover?: (data: PositionData) => void;
  onDoubleClick?: (data: PositionData) => void;
  showTooltip?: boolean;
  isInteractive?: boolean;
}

// ---------------------------
// **InteractivePositionBox 훅**
// ---------------------------
export const useInteractivePositionBox = () => {
  const [selectedPosition, setSelectedPosition] = useState<PositionData | null>(null);
  const [highlightedPositions, setHighlightedPositions] = useState<string[]>([]);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

  // 클릭 핸들러 (더블클릭과 충돌 방지)
  const handlePositionClick = (data: PositionData) => {
    console.log('Position clicked:', data);
    
    // 기존 타이머가 있으면 취소 (더블클릭인 경우)
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      return; // 더블클릭으로 처리되므로 단일 클릭은 무시
    }

    // 300ms 후에 단일 클릭 처리
    const timeout = setTimeout(() => {
      setSelectedPosition(data);
      setClickTimeout(null);
      
      // 콘솔에만 로그 출력 (alert 제거)
      console.log(`선택됨: ${data.title} - ${data.subtitle}`);
    }, 300);
    
    setClickTimeout(timeout);
  };

  // 더블클릭 핸들러
  const handlePositionDoubleClick = (data: PositionData) => {
    console.log('Position double-clicked for editing:', data);
    
    // 단일 클릭 타이머 취소
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }

    // 즉시 편집 모드로 진입
    const newManpower = prompt(`${data.title}의 인원수를 입력하세요:`, data.manpower?.toString() || '1');
    const newDepartment = prompt(`${data.title}의 부서를 입력하세요:`, data.department || '');
    
    if (newManpower !== null && newDepartment !== null) {
      alert(`업데이트 완료!\n\n${data.title}\n• 인원: ${newManpower}명\n• 부서: ${newDepartment}\n\n(실제 구현에서는 상태를 업데이트합니다)`);
    }
  };

  // 호버 핸들러
  const handlePositionHover = (data: PositionData) => {
    console.log('Position hovered:', data);
    // 관련 위치들 하이라이트
    if (data.lineIndex !== undefined) {
      const relatedIds = [`line-${data.lineIndex}`];
      setHighlightedPositions(relatedIds);
    }
  };

  // PositionData 생성 함수
  const createInteractivePositionData = (
    title: string,
    subtitle?: string,
    level: number = 0,
    colorCategory?: 'direct' | 'indirect' | 'OH',
    additionalData?: Partial<PositionData>
  ): PositionData => {
    const data = createPositionDataFromLegacy(title, subtitle, level, colorCategory);
    
    // 추가 데이터 병합
    if (additionalData) {
      Object.assign(data, additionalData);
    }
    
    // 선택/하이라이트 상태 적용
    data.isSelected = selectedPosition?.id === data.id;
    data.isHighlighted = highlightedPositions.includes(data.id);

    return data;
  };

  return {
    selectedPosition,
    setSelectedPosition,
    highlightedPositions,
    setHighlightedPositions,
    handlePositionClick,
    handlePositionDoubleClick,
    handlePositionHover,
    createInteractivePositionData,
  };
};

// ---------------------------
// **상호작용 가능한 직책 박스 컴포넌트**
// ---------------------------
export const InteractivePositionBox: React.FC<InteractivePositionBoxProps> = ({ 
  data,
  className = '', 
  onClick,
  onHover,
  onDoubleClick,
  showTooltip = true,
  isInteractive = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  // 위치 정보 계산
  const updatePosition = () => {
    if (!boxRef.current) return;
    
    const rect = boxRef.current.getBoundingClientRect();
    const positionData = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      anchors: {
        topLeft: { x: rect.left, y: rect.top },
        topCenter: { x: rect.left + rect.width / 2, y: rect.top },
        topRight: { x: rect.left + rect.width, y: rect.top },
        centerLeft: { x: rect.left, y: rect.top + rect.height / 2 },
        center: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        centerRight: { x: rect.left + rect.width, y: rect.top + rect.height / 2 },
        bottomLeft: { x: rect.left, y: rect.top + rect.height },
        bottomCenter: { x: rect.left + rect.width / 2, y: rect.top + rect.height },
        bottomRight: { x: rect.left + rect.width, y: rect.top + rect.height },
      }
    };
    
    // data 객체에 위치 정보 업데이트
    data.position = positionData;
  };

  // 드래그 핸들러들 - 개선된 로직
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!data.isDraggable) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // 드래그 시작 시 마우스 위치 저장
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    
    // 현재 드래그 위치 초기화
    setDragPosition({ x: 0, y: 0 });
    data.isDragging = true;
    
    // 전역 마우스 이벤트 등록
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!data.isDragging) return;
      
      e.preventDefault();
      
      // 마우스 이동 거리만큼 박스 이동 (1:1 비율)
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setDragPosition({ x: deltaX, y: deltaY });
    };
    
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (data.isDragging) {
        data.isDragging = false;
        // 드래그 완료 후 위치 초기화 
        setDragPosition({ x: 0, y: 0 });
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        
        e.preventDefault();
      }
    };
    
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    // 이 함수는 더 이상 사용하지 않음 (handleMouseDown 내부로 이동)
  };

  const handleMouseUp = (e?: MouseEvent) => {
    // 이 함수는 더 이상 사용하지 않음 (handleMouseDown 내부로 이동)
  };

  // 컴포넌트 마운트 시와 리사이즈 시 위치 업데이트
  useEffect(() => {
    updatePosition();
    
    const handleResize = () => updatePosition();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      // 드래그 관련 이벤트는 handleMouseDown에서 직접 관리
    };
  }, []);

  let baseClassName = `
    w-48 h-20
    border border-gray-300 rounded
    flex flex-col justify-center items-center m-2
    transition-all duration-200
    relative
  `;
  
  // 드래그 중일 때 스타일 추가
  if (data.isDragging) {
    baseClassName += " shadow-2xl scale-105 z-50 opacity-90 cursor-grabbing";
  } else if (data.isDraggable && isInteractive) {
    baseClassName += " cursor-grab";
  }
  
  // 상호작용 가능한 경우 커서와 호버 효과 추가
  if (isInteractive && !data.isDragging) {
    baseClassName += " hover:shadow-xl hover:scale-110 hover:z-10";
    
    // 호버 시 더 강한 시각적 피드백
    if (isHovered) {
      baseClassName += " shadow-xl scale-110 z-10 ring-2 ring-blue-400";
    }
  }

  // 선택/하이라이트 상태
  if (data.isSelected) {
    baseClassName += " ring-4 ring-blue-500 shadow-lg z-20";
  }
  if (data.isHighlighted) {
    baseClassName += " ring-2 ring-yellow-400";
  }
  
  // 색상 체계 적용 (호버 시 더 진한 색상)
  if (data.colorCategory) {
    if (data.colorCategory === 'OH') {
      baseClassName += isHovered 
        ? " bg-gray-500 border-gray-600 text-white" 
        : " bg-gray-400 border-gray-500 text-black";
    } else if (data.colorCategory === 'indirect') {
      baseClassName += isHovered 
        ? " bg-gray-300 border-gray-500 text-black" 
        : " bg-gray-200 border-gray-400 text-black";
    } else if (data.colorCategory === 'direct') {
      baseClassName += isHovered 
        ? " bg-gray-100 border-gray-400 text-black" 
        : " bg-gray-50 border-gray-300 text-black";
    }
  } else {
    // 기존 level 기반 색상 (호버 시 더 진하게)
    if (data.level === 0) {
      baseClassName += isHovered 
        ? " bg-gray-800 text-white border-gray-600" 
        : " bg-gray-700 text-white border-gray-500";
    } else if (data.level === 1) {
      baseClassName += isHovered 
        ? " bg-gray-600 text-white border-gray-800" 
        : " bg-gray-500 text-white border-gray-700";
    } else if (data.level === 2) {
      baseClassName += isHovered 
        ? " bg-gray-500 border-gray-600" 
        : " bg-gray-400 border-gray-500";
    } else if (data.level === 3) {
      baseClassName += isHovered 
        ? " bg-gray-400 border-gray-600" 
        : " bg-gray-300 border-gray-500";
    } else {
      baseClassName += isHovered 
        ? " bg-blue-100 border-gray-600" 
        : " bg-blue-50 border-gray-500";
    }
  }

  // 상태별 색상 오버라이드
  if (data.status === 'inactive') {
    baseClassName += " opacity-50";
  } else if (data.status === 'planning') {
    baseClassName += " border-dashed";
  }

  const handleClick = (e: React.MouseEvent) => {
    if (data.isDragging) return; // 드래그 중에는 클릭 무시
    e.stopPropagation();
    if (onClick) onClick(data);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (data.isDragging) return; // 드래그 중에는 더블클릭 무시
    e.stopPropagation();
    if (onDoubleClick) onDoubleClick(data);
  };

  const handleMouseEnter = () => {
    if (!data.isDragging) {
      setIsHovered(true);
      if (onHover) onHover(data);
    }
  };

  const handleMouseLeave = () => {
    if (!data.isDragging) {
      setIsHovered(false);
    }
  };

  // 드래그 중일 때 transform 적용
  const boxStyle: React.CSSProperties = data.isDragging ? {
    transform: `translate(${dragPosition.x}px, ${dragPosition.y}px)`,
    zIndex: 1000,
    position: 'relative',
  } : {};

  return (
    <div className="relative">
      {/* GL 객체의 상단 연결선 - 박스 위로 20px */}
      {data.title === "GL" && (
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 bg-gray-400"
          style={{
            width: '2px',
            height: '20px',
            top: '-12px', // 박스 상단에서 위로 20px (margin 8px 고려)
            zIndex: 5
          }}
        />
      )}
      
      <div 
        className={`${baseClassName} ${className}`}
        style={boxStyle}
        onClick={isInteractive ? handleClick : undefined}
        onDoubleClick={isInteractive ? handleDoubleClick : undefined}
        onMouseDown={isInteractive && data.isDraggable ? handleMouseDown : undefined}
        onMouseEnter={isInteractive ? handleMouseEnter : undefined}
        onMouseLeave={isInteractive ? handleMouseLeave : undefined}
        data-position-id={data.id}
        data-position-title={data.title}
        ref={boxRef}
      >
        <div className="text-center">
          <div className="font-bold text-xs">{data.title}</div>
          {data.subtitle && <div className="text-xs">{data.subtitle}</div>}
          {data.manpower && <div className="text-xs text-gray-600">{data.manpower}명</div>}
        </div>

        {/* 호버 시 추가 정보 표시 (드래그 중에는 숨김) */}
        {isHovered && showTooltip && !data.isDragging && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-black text-white text-xs rounded shadow-lg z-50 min-w-[250px]">
            <div className="font-semibold text-sm mb-2">{data.title} - {data.subtitle}</div>
            <div className="space-y-1">
              {data.department && <div>📍 부서: {data.department}</div>}
              {data.manpower && <div>👥 인원: {data.manpower}명</div>}
              {data.workload && <div>📊 작업량: {data.workload}%</div>}
              {data.efficiency && <div>⚡ 효율성: {data.efficiency}%</div>}
              {data.processName && <div>🔧 공정: {data.processName}</div>}
              {data.shiftInfo && <div>⏰ 교대: {data.shiftInfo}</div>}
              {data.responsibilities && data.responsibilities.length > 0 && (
                <div>💼 담당업무: {data.responsibilities.join(', ')}</div>
              )}
              {data.skills && data.skills.length > 0 && (
                <div>🎯 필요스킬: {data.skills.join(', ')}</div>
              )}
            </div>
            <div className="text-xs text-gray-300 mt-2 pt-2 border-t border-gray-600">
              💡 클릭: 선택 | 더블클릭: 편집 | 드래그: 이동
            </div>
          </div>
        )}

        {/* 상태 표시 아이콘 */}
        {data.status && (
          <div className="absolute top-1 right-1">
            {data.status === 'active' && <div className="w-2 h-2 bg-green-500 rounded-full" title="활성"></div>}
            {data.status === 'inactive' && <div className="w-2 h-2 bg-red-500 rounded-full" title="비활성"></div>}
            {data.status === 'planning' && <div className="w-2 h-2 bg-yellow-500 rounded-full" title="계획중"></div>}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------
// **헬퍼 함수들**
// ---------------------------
export const createPositionData = (
  title: string,
  subtitle?: string,
  options?: Partial<PositionData>
): PositionData => {
  // 일관된 ID 생성 (호버할 때마다 바뀌지 않도록)
  const baseId = `${title}-${subtitle || 'default'}`.replace(/[^a-zA-Z0-9]/g, '-');
  const id = options?.lineIndex !== undefined ? `${baseId}-line${options.lineIndex}` : baseId;
  
  return {
    id,
    title,
    subtitle,
    level: 0,
    isDraggable: true,
    isDragging: false,
    ...options
  };
};

export const createPositionDataFromLegacy = (
  title: string,
  subtitle?: string,
  level: number = 0,
  colorCategory?: 'direct' | 'indirect' | 'OH'
): PositionData => {
  return createPositionData(title, subtitle, {
    level,
    colorCategory,
    status: 'active'
  });
}; 