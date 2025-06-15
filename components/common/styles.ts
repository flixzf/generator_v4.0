// 간격 관련 스타일
export const GAPS = {
  DEFAULT: 'gap-4',
  SMALL: 'gap-2',
  MEDIUM: 'gap-8',
  LARGE: 'gap-16',
  XLARGE: 'gap-32'
} as const;

// 배경색 관련 스타일
export const BACKGROUNDS = {
  PRIMARY: 'bg-white',
  SECONDARY: 'bg-gray-50',
  TERTIARY: 'bg-gray-100',
  QUATERNARY: 'bg-gray-200'
} as const;

// 테두리 관련 스타일
export const BORDERS = {
  DEFAULT: 'border border-gray-500 rounded',
  LIGHT: 'border border-gray-300 rounded',
  NONE: 'border-none',
  ROUNDED: {
    DEFAULT: 'rounded',
    LARGE: 'rounded-lg'
  }
} as const;

// 레이아웃 관련 스타일
export const LAYOUTS = {
  FLEX: {
    CENTER: 'flex items-center justify-center',
    COLUMN: 'flex flex-col',
    ROW: 'flex flex-row'
  },
  POSITION: {
    RELATIVE: 'relative',
    ABSOLUTE: 'absolute'
  }
} as const;

// 부서별 간격 설정
export const DEPARTMENT_GAPS = {
  BETWEEN_DEPARTMENTS: GAPS.XLARGE,  // 부서 간 간격
  BETWEEN_TL: GAPS.LARGE,           // TL 간 간격
  BETWEEN_TM: GAPS.MEDIUM           // TM 간 간격
} as const;

// 분기선 관련 스타일
export const CONNECTORS = {
  // 수직선
  VERTICAL: {
    DEFAULT: 'w-[2px] bg-gray-500',  // 기본 수직선
    SHORT: 'h-[20px]',               // 짧은 수직선
    MEDIUM: 'h-[40px]',              // 중간 수직선
    LONG: 'h-[60px]'                 // 긴 수직선
  },
  // 수평선
  HORIZONTAL: {
    DEFAULT: 'h-[2px] bg-gray-500',  // 기본 수평선
    SHORT: 'w-[20px]',               // 짧은 수평선
    MEDIUM: 'w-[40px]',              // 중간 수평선
    LONG: 'w-[60px]'                 // 긴 수평선
  },
  // 연결선 컨테이너
  CONTAINER: {
    DEFAULT: 'flex items-center justify-center',
    VERTICAL: 'flex-col',
    HORIZONTAL: 'flex-row'
  }
} as const;

// 공통 컴포넌트 스타일
export const COMMON_STYLES = {
  // 설정 패널
  CONFIG_PANEL: `${LAYOUTS.POSITION.ABSOLUTE} ${BACKGROUNDS.PRIMARY} p-4 ${BORDERS.DEFAULT} shadow-lg z-10`,
  
  // 인원 합계창
  TOTAL_COUNT: `${LAYOUTS.POSITION.ABSOLUTE} z-50 ${BACKGROUNDS.PRIMARY} p-4 ${BORDERS.DEFAULT} shadow-lg`,
  
  // 줌 컨트롤
  ZOOM_CONTROL: `${BACKGROUNDS.PRIMARY} p-2 ${BORDERS.DEFAULT} shadow hover:bg-gray-100`,
  
  // 부서 컨테이너
  DEPARTMENT: `${LAYOUTS.FLEX.COLUMN} items-center`,
  
  // 부서 타이틀 (GL이 없는 부서용)
  TITLE: `${BACKGROUNDS.PRIMARY} border-white text-[2em] font-bold`,
  
  // 버튼
  BUTTON: {
    DEFAULT: `${BACKGROUNDS.PRIMARY} ${BORDERS.DEFAULT} hover:bg-gray-100`,
    SMALL: 'w-10 h-10',
    MEDIUM: 'w-20 h-10'
  },
  
  // 박스 간 연결선
  CONNECTING_LINES: {
    CONTAINER: `${LAYOUTS.FLEX.CENTER} ${GAPS.DEFAULT}`,
    LINE: `${BORDERS.DEFAULT} flex-1`
  }
} as const;

export const SPACING = {
  // 수직 계층 간격 (GL-TL-TM)
  HIERARCHY: {
    VERTICAL: 'mt-3', // 12px
  },
  // 같은 카테고리 내 요소 간격
  CATEGORY: {
    INNER: 'gap-2', // 8px
  },
  // 카테고리 간 간격
  DEPARTMENT: {
    BETWEEN: 'gap-8', // 32px (기존 gap-32의 1/4)
  }
}; 