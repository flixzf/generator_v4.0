/**
 * 🔧 Common Utility Functions
 * LineUtils와 기타 공통 유틸리티 함수들
 */

// === 라인 생성 함수들 ===

/**
 * 더블 라인 생성 (Line 1-2, Line 3-4, ...)
 * 홀수일 경우 마지막은 단일 라인
 */
export function makeDoubleLines(count: number, prefix = 'Line '): string[] {
  const result: string[] = [];
  let i = 1;
  
  while (i <= count) {
    if (i + 1 <= count) {
      result.push(`${prefix}${i}-${i + 1}`);
      i += 2;
    } else {
      result.push(`${prefix}${i}`);
      i += 1;
    }
  }
  
  return result;
}

/**
 * 단일 라인 생성 (Line 1, Line 2, ...)
 */
export function makeSingleLines(count: number, prefix = 'Line '): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);
}

// === 배송 관련 계산 ===

/**
 * 라인 수에 따른 배송 TM 수 계산
 */
export function getShippingTMCount(lineCount: number): number {
  if (lineCount <= 8) {
    // 인덱스 0~8에 대응하는 배송 TM 수
    return [0, 1, 2, 3, 3, 4, 5, 6, 6][lineCount] || 0;
  }
  return Math.ceil(lineCount * 0.75);
}

// === 배열 처리 유틸 ===

/**
 * 배열을 청크 단위로 분할
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) return [];
  const chunks: T[][] = [];
  
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  
  return chunks;
}

/**
 * 배열 평탄화 (중첩 배열을 1차원으로)
 */
export function flatten<T>(arrays: T[][]): T[] {
  return arrays.reduce((acc, arr) => acc.concat(arr), []);
}

/**
 * 고유값 필터링
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

// === 문자열 처리 유틸 ===

/**
 * 첫 글자 대문자화
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * 카멜케이스를 스페이스로 분할
 */
export function splitCamelCase(str: string): string {
  return str.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * 문자열 줄바꿈 처리
 */
export function breakLongText(text: string, maxLength: number = 20): string {
  if (text.length <= maxLength) return text;
  
  const words = text.split(' ');
  if (words.length === 1) return text; // 단일 단어는 그대로
  
  const mid = Math.ceil(words.length / 2);
  return words.slice(0, mid).join(' ') + '\n' + words.slice(mid).join(' ');
}

// === 숫자 처리 유틸 ===

/**
 * 범위 내 값으로 제한
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 반올림 (소수점 자리 지정)
 */
export function round(value: number, decimals: number = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// === 객체 처리 유틸 ===

/**
 * 깊은 복사
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  
  const clonedObj = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
}

/**
 * 빈 값 체크 (null, undefined, 빈 문자열, 빈 배열)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// === 부서명 정규화 ===

/**
 * 부서명 정규화 (줄바꿈 제거, 별칭 처리)
 */
export function normalizeDepartmentName(department: string): string {
  if (!department) return department;
  
  // 줄바꿈으로 분할된 경우 첫 번째 라인만 사용
  const mainDepartmentName = department.split('\n')[0].trim();
  
  // 부서명 별칭 정규화
  const normalizations: Record<string, string> = {
    'RawMaterial': 'Raw Material',
    'SubMaterial': 'Sub Material', 
    'BottomMarket': 'Bottom Market',
    'FGWH': 'FG WH',
    'ACC': 'ACC Market',
    'PL': 'P&L Market'
  };

  return normalizations[mainDepartmentName] || mainDepartmentName;
}

// === 디버깅 유틸 ===

/**
 * 개발 환경에서만 콘솔 로그 출력
 */
export function devLog(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    if (data) {
      console.log(`[DEV] ${message}`, data);
    } else {
      console.log(`[DEV] ${message}`);
    }
  }
}

/**
 * 성능 측정
 */
export function measure<T>(fn: () => T, label?: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (label) {
    devLog(`${label} took ${round(end - start, 2)}ms`);
  }
  
  return result;
}