export type DeptLike = {
  title: string[] | string;
  hasGL?: boolean;
  glCount?: number;
  tl: string[];
  tm: string[][];
};

// 공통 간격/레이아웃 상수 (page3 기준)
export const COL_SPACING = 160;     // 열 간 가로 간격
export const DEPT_GUTTER = -50;     // 부서 간 가로 여백(통일 상수)
export const EDGE_OFFSET = 24;      // edge 꺾임 오프셋(기본 수치)
export const LEVEL_HEIGHT = 120;    // 레벨 간 세로 간격(GL↔TL↔TM)
export const TM_ROW_SPACING = 80;   // TM 세로 스택 간격

// 공통 부서 폭 계산: GL/TL/TM 컬럼 수의 최대값 기준
export function calculateDeptWidth(dept: DeptLike): number {
  const glCols = dept.glCount ? Number(dept.glCount) : (dept.hasGL ? 1 : 0);
  const tlCols = Array.isArray(dept.tl) ? dept.tl.length : 0;
  const tmCols = Array.isArray(dept.tm) ? dept.tm.length : 0;
  const numColumns = Math.max(tlCols, tmCols, glCols, 1);
  return numColumns * COL_SPACING + 80;
}

// ===== 공통 계층 Y 좌표 정의 =====
export const HIERARCHY_Y_POSITIONS = {
  PM: 0,                           // PM 레벨
  LM: LEVEL_HEIGHT,               // LM 레벨 (120px)
  GL: LEVEL_HEIGHT * 2,           // GL 레벨 (240px)
  TL: LEVEL_HEIGHT * 3,           // TL 레벨 (360px)
  TM_BASE: LEVEL_HEIGHT * 4,      // TM 시작 레벨 (480px)
  DEPT: 0,                        // DEPT는 PM과 같은 레벨
} as const;

// 계층별 Y 좌표 가져오기 함수
export function getHierarchyY(level: 'PM' | 'LM' | 'GL' | 'TL' | 'TM_BASE' | 'DEPT'): number {
  return HIERARCHY_Y_POSITIONS[level];
}

// TM Y 좌표 계산 (세로 스택용)
export function getTMY(baseY: number = HIERARCHY_Y_POSITIONS.TM_BASE, stackIndex: number = 0): number {
  return baseY + stackIndex * TM_ROW_SPACING;
}

// ===== 연결선 꺾임점 규칙 =====
// 규칙1: 인접 레벨 연결 - smoothstep 사용 (자연스러운 곡선)
// 규칙2: 레벨 건너뛰기 연결 - customCenterY + 박스들 사이 빈 공간 중앙에서 꺾임
// 규칙3: 꺾임점 = (상위박스하단 + 하위박스상단) / 2

// 박스 치수 정의 (CustomPositionNode.tsx와 일치)
export const BOX_HEIGHT = 60 + 16; // minHeight(60px) + padding(8px*2)
export const DEPT_BOX_HEIGHT = 40 + 16; // minHeight(40px) + padding(8px*2)

// 연결 타입 판단
export function getConnectionType(sourceLevel: keyof typeof HIERARCHY_Y_POSITIONS, targetLevel: keyof typeof HIERARCHY_Y_POSITIONS): 'adjacent' | 'skip' {
  const sourceLevelIndex = getLevelIndex(sourceLevel);
  const targetLevelIndex = getLevelIndex(targetLevel);
  const levelDiff = Math.abs(targetLevelIndex - sourceLevelIndex);
  return levelDiff === 1 ? 'adjacent' : 'skip';
}

// 레벨 인덱스 가져오기
function getLevelIndex(level: keyof typeof HIERARCHY_Y_POSITIONS): number {
  const levelOrder = ['PM', 'DEPT', 'LM', 'GL', 'TL', 'TM_BASE'] as const;
  const index = levelOrder.indexOf(level);
  return index === -1 ? 0 : index;
}

// 레벨별 박스 높이 가져오기
export function getBoxHeight(level: keyof typeof HIERARCHY_Y_POSITIONS): number {
  return level === 'DEPT' ? DEPT_BOX_HEIGHT : BOX_HEIGHT;
}

// 건너뛰기 연결의 꺾임점 계산 (박스들 사이 빈 공간의 중앙)
export function getSkipConnectionBendY(
  sourceLevel: keyof typeof HIERARCHY_Y_POSITIONS,
  targetLevel: keyof typeof HIERARCHY_Y_POSITIONS
): number {
  const sourceBoxBottom = getHierarchyY(sourceLevel) + getBoxHeight(sourceLevel);
  const targetBoxTop = getHierarchyY(targetLevel);
  return (sourceBoxBottom + targetBoxTop) / 2;
}

// 연결선 설정 생성 헬퍼
export function createEdgeConfig(
  sourceLevel: keyof typeof HIERARCHY_Y_POSITIONS,
  targetLevel: keyof typeof HIERARCHY_Y_POSITIONS,
  options?: { forceUnifiedBendY?: number }
) {
  const connectionType = getConnectionType(sourceLevel, targetLevel);
  
  // 통일된 꺾임점이 강제 지정된 경우
  if (options?.forceUnifiedBendY !== undefined) {
    return {
      type: 'customCenterY' as const,
      data: { centerY: options.forceUnifiedBendY, offset: EDGE_OFFSET }
    };
  }
  
  if (connectionType === 'adjacent') {
    // 인접 레벨: customCenterY + 박스들 사이 빈 공간 중앙 (일관성을 위해)
    const bendY = getSkipConnectionBendY(sourceLevel, targetLevel);
    return {
      type: 'customCenterY' as const,
      data: { centerY: bendY, offset: EDGE_OFFSET }
    };
  } else {
    // 레벨 건너뛰기: customCenterY + 박스들 사이 빈 공간 중앙에서 꺾임
    const bendY = getSkipConnectionBendY(sourceLevel, targetLevel);
    return {
      type: 'customCenterY' as const,
      data: { centerY: bendY, offset: EDGE_OFFSET }
    };
  }
}

// GL 연결의 통일된 꺾임점 계산 (GL→TL 기준)
export function getUnifiedGLBendY(): number {
  return getSkipConnectionBendY('GL', 'TL');
}

// ===== 공통 정렬 유틸 =====
export function average(xs: number[]): number {
  return xs && xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export function defaultGridXs(centerX: number, count: number, spacing: number): number[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => centerX + (i - (count - 1) / 2) * spacing);
}

// TM 카테고리용 X 좌표 계산 (카테고리 수 = columns 수)
export function computeCategoryXs(
  deptCenterX: number,
  numColumns: number,
  spacing: number,
  categoryCount: number,
): number[] {
  return Array.from({ length: categoryCount }, (_, catIdx) =>
    deptCenterX + (catIdx - (numColumns - 1) / 2) * spacing
  );
}

// TL X: 자신의 직하단 TM 카테고리 X의 평균으로 정렬
export function computeTLXs(
  tlCount: number,
  deptCenterX: number,
  gridColumnsForFallback: number,
  spacing: number,
  catXs: number[],
  mapCatToTLIndex: (catIdx: number, tlCount: number) => number = (catIdx, count) => Math.min(catIdx, Math.max(0, count - 1)),
  isCatChildOfTL: (catIdx: number) => boolean = () => true,
): number[] {
  const defaultTlXs = defaultGridXs(deptCenterX, tlCount, spacing);
  if (tlCount === 0) return [];
  const buckets: number[][] = Array.from({ length: tlCount }, () => []);
  for (let catIdx = 0; catIdx < catXs.length; catIdx++) {
    if (!isCatChildOfTL(catIdx)) continue;
    const tlIdx = mapCatToTLIndex(catIdx, tlCount);
    if (tlIdx >= 0 && tlIdx < tlCount) buckets[tlIdx].push(catXs[catIdx]);
  }
  // fallback은 페이지 기존 규칙을 유지: Math.max(TL 수, 전체 컬럼 수)를 그리드 기준으로 사용
  return buckets.map((xs, i) => {
    if (xs.length) return average(xs);
    const gridCount = Math.max(tlCount, gridColumnsForFallback);
    return deptCenterX + (i - (gridCount - 1) / 2) * spacing;
  });
}

// 순차적 GL→TL 매핑: GL들을 TL들에 연속적으로 할당
export function sequentialGLToTLMapping(glCount: number, tlCount: number): number[][] {
  if (glCount <= 0 || tlCount <= 0) return [];
  const result: number[][] = Array.from({ length: glCount }, () => []);
  const tlsPerGL = Math.ceil(tlCount / glCount);
  for (let t = 0; t < tlCount; t++) {
    const glIdx = Math.floor(t / tlsPerGL);
    if (glIdx < glCount) result[glIdx].push(t);
  }
  return result;
}

// GL X: 자신의 직하단 TL X의 평균으로 정렬 (순차적 매핑 사용)
export function computeGLXs(
  glCount: number,
  deptCenterX: number,
  spacing: number,
  tlXs: number[],
): number[] {
  if (glCount <= 0) return [];
  const defaultGlXs = defaultGridXs(deptCenterX, glCount, spacing);
  if (tlXs.length === 0) return defaultGlXs;
  
  // 순차적 매핑: GL0→TL0,1,2... / GL1→TL3,4,5... 방식
  const mapping = sequentialGLToTLMapping(glCount, tlXs.length);
  return mapping.map((tlIndices, glIdx) => {
    if (tlIndices.length === 0) return defaultGlXs[glIdx];
    const childXs = tlIndices.map(tlIdx => tlXs[tlIdx]);
    return average(childXs);
  });
}

// 부서명(최상위) X: 직하단 계층(GL → TL → TM 카테고리) 순으로 평균
export function computeDeptNameX(
  glXs: number[],
  tlXs: number[],
  catXs: number[],
  fallbackCenterX: number,
): number {
  if (glXs && glXs.length) return average(glXs);
  if (tlXs && tlXs.length) return average(tlXs);
  if (catXs && catXs.length) return average(catXs);
  return fallbackCenterX;
}


