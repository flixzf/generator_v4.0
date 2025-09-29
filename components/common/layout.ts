/**
 * ?뱪 Layout Calculation Utils
 * ?덉씠?꾩썐怨??꾩튂 怨꾩궛??媛꾩냼?뷀븳 ?좏떥由ы떚
 */

// === 湲곕낯 ????뺤쓽 ===
export interface Position {
  x: number;
  y: number;
}

export interface DeptLayout {
  title: string[] | string;
  hasGL?: boolean;
  glCount?: number;
  tl: string[];
  tm: string[][];
  parts?: (string | null)[];
  categoryTLMap?: number[];
}

// === ?덉씠?꾩썐 ?곸닔 ===
export const LAYOUT_CONFIG = {
  // 媛꾧꺽 ?ㅼ젙
  COL_SPACING: 180, // ?닿컙 媛濡?媛꾧꺽 (李멸퀬: 160px)
  ROW_SPACING: 80, // TM ?몃줈 媛꾧꺽 (諛뺤뒪 64px + ?щ갚 16px = 80px)
  LEVEL_HEIGHT: 120, // ?덈꺼媛??몃줈 媛꾧꺽
  DEPT_GUTTER: 50, // 遺?쒓컙 ?щ갚 (李멸퀬: 50px)
  EDGE_OFFSET: 24, // edge 爰얠엫 ?ㅽ봽??
  TM_ROW_SPACING: 80, // TM ?몃줈 ?ㅽ깮 媛꾧꺽

  // ?곌껐??爰얠엫 嫄곕━ ?쒖???
  STANDARD_BEND_DISTANCE: 40, // ?쒖? 爰얠엫 嫄곕━ (諛뺤뒪 ?섎떒?먯꽌 40px ?꾨옒)

  // ?쇱씤/遺?쒓컙 媛꾧꺽
  LINE_PADDING: 50, // Page1 ?쇱씤媛?媛꾧꺽 (李멸퀬: 50px)
  DEPT_PADDING: 100, // 遺꾨━??怨듭젙 媛꾧꺽 (李멸퀬: 100px)

  // 怨꾩링 Y 醫뚰몴
  Y_POSITIONS: {
    VSM: 0,
    A_VSM: 120,
    GL: 240,
    TL: 360,
    PART: 420,
    TM_BASE: 480,
    DEPT: 0,
  },

  // 諛뺤뒪 ?ш린
  BOX_HEIGHT: 76, // ?쇰컲 諛뺤뒪 ?믪씠
  DEPT_BOX_HEIGHT: 56, // 遺?쒕챸 諛뺤뒪 ?믪씠
} as const;

// === ?듭떖 怨꾩궛 ?⑥닔??===

/**
 * ?듯빀 ?뷀떚????怨꾩궛 (?쇱씤/遺??怨듯넻)
 */
export function calculateEntityWidth(
  columnCount: number,
  minWidth: number = 0,
): number {
  return (
    Math.max(minWidth, columnCount * LAYOUT_CONFIG.COL_SPACING) +
    LAYOUT_CONFIG.DEPT_GUTTER
  );
}

/**
 * 遺????怨꾩궛 (?듯빀 ?⑥닔 ?ъ슜)
 */
export function calculateDeptWidth(dept: DeptLayout): number {
  const glCols = dept.glCount || (dept.hasGL ? 1 : 0);
  const tlCols = dept.tl.length;
  const tmCols = dept.tm.length;
  const maxCols = Math.max(glCols, tlCols, tmCols, 1);

  return calculateEntityWidth(maxCols, 0); // 遺?쒕뒗 理쒖냼 ??0
}

/**
 * 寃⑹옄 X 醫뚰몴 ?앹꽦 (以묒븰 ?뺣젹)
 */
export function createGridXs(
  centerX: number,
  count: number,
  spacing: number = LAYOUT_CONFIG.COL_SPACING,
): number[] {
  if (count <= 0) return [];
  return Array.from(
    { length: count },
    (_, i) => centerX + (i - (count - 1) / 2) * spacing,
  );
}

/**
 * Y 醫뚰몴 怨꾩궛
 */
export function getYPosition(
  level: keyof typeof LAYOUT_CONFIG.Y_POSITIONS,
  stackIndex = 0,
): number {
  const baseY = LAYOUT_CONFIG.Y_POSITIONS[level];
  return level === "TM_BASE"
    ? baseY + stackIndex * LAYOUT_CONFIG.ROW_SPACING
    : baseY;
}

/**
 * 湲곗〈 ?⑥닔紐낅뱾怨??명솚?깆쓣 ?꾪븳 蹂꾩묶??
 */
export const getHierarchyY = getYPosition;
export const getTMY = (
  baseY: number = LAYOUT_CONFIG.Y_POSITIONS.TM_BASE,
  stackIndex: number = 0,
): number => {
  return baseY + stackIndex * LAYOUT_CONFIG.TM_ROW_SPACING;
};

/**
 * ?됯퇏 怨꾩궛
 */
export function average(values: number[]): number {
  return values.length > 0
    ? values.reduce((a, b) => a + b, 0) / values.length
    : 0;
}

/**
 * TM 移댄뀒怨좊━ X 醫뚰몴 怨꾩궛
 */
export function computeCategoryXs(
  centerX: number,
  categoryCount: number,
  spacing = LAYOUT_CONFIG.COL_SPACING,
): number[] {
  return createGridXs(centerX, categoryCount, spacing);
}

/**
 * TL X 醫뚰몴 怨꾩궛 (?섏쐞 TM 移댄뀒怨좊━ 以묒떖?쇰줈 ?뺣젹)
 */
export function computeTLXs(
  tlCount: number,
  deptCenterX: number,
  catXs: number[],
  spacing = LAYOUT_CONFIG.COL_SPACING,
): number[] {
  if (tlCount === 0) return [];

  const defaultXs = createGridXs(deptCenterX, tlCount, spacing);
  if (catXs.length === 0) return defaultXs;

  // TL蹂꾨줈 愿由ы븯??移댄뀒怨좊━?ㅼ쓣 洹몃９??
  const buckets: number[][] = Array.from({ length: tlCount }, () => []);
  const categoriesPerTL = Math.ceil(catXs.length / tlCount);

  catXs.forEach((catX, catIdx) => {
    const tlIdx = Math.min(Math.floor(catIdx / categoriesPerTL), tlCount - 1);
    buckets[tlIdx].push(catX);
  });

  return buckets.map((catXsForTL, tlIdx) =>
    catXsForTL.length > 0 ? average(catXsForTL) : defaultXs[tlIdx],
  );
}

/**
 * GL X 醫뚰몴 怨꾩궛 (?섏쐞 TL 以묒떖?쇰줈 ?뺣젹)
 */
export function computeGLXs(
  glCount: number,
  deptCenterX: number,
  tlXs: number[],
  spacing = LAYOUT_CONFIG.COL_SPACING,
): number[] {
  if (glCount === 0) return [];

  const defaultXs = createGridXs(deptCenterX, glCount, spacing);
  if (tlXs.length === 0) return defaultXs;

  // GL蹂꾨줈 愿由ы븯??TL?ㅼ쓣 ?쒖감 諛곕텇
  const tlsPerGL = Math.ceil(tlXs.length / glCount);
  const buckets: number[][] = Array.from({ length: glCount }, () => []);

  tlXs.forEach((tlX, tlIdx) => {
    const glIdx = Math.min(Math.floor(tlIdx / tlsPerGL), glCount - 1);
    buckets[glIdx].push(tlX);
  });

  return buckets.map((tlXsForGL, glIdx) =>
    tlXsForGL.length > 0 ? average(tlXsForGL) : defaultXs[glIdx],
  );
}

/**
 * 遺?쒕챸 X 醫뚰몴 怨꾩궛 (?섏쐞 怨꾩링 以묒떖)
 */
export function computeDeptNameX(
  glXs: number[],
  tlXs: number[],
  catXs: number[],
  fallbackX: number,
): number {
  if (glXs.length > 0) return average(glXs);
  if (tlXs.length > 0) return average(tlXs);
  if (catXs.length > 0) return average(catXs);
  return fallbackX;
}

/**
 * ?곌껐??爰얠엫??怨꾩궛
 */
export function getEdgeBendY(
  sourceLevel: keyof typeof LAYOUT_CONFIG.Y_POSITIONS,
  targetLevel: keyof typeof LAYOUT_CONFIG.Y_POSITIONS,
): number {
  const sourceY = LAYOUT_CONFIG.Y_POSITIONS[sourceLevel];
  const targetY = LAYOUT_CONFIG.Y_POSITIONS[targetLevel];

  const sourceBottom =
    sourceY +
    (sourceLevel === "DEPT"
      ? LAYOUT_CONFIG.DEPT_BOX_HEIGHT
      : LAYOUT_CONFIG.BOX_HEIGHT);

  return (sourceBottom + targetY) / 2;
}

/**
 * 遺???덉씠?꾩썐 ?꾩껜 怨꾩궛
 */
export interface DeptPositions {
  deptX: number;
  glXs: number[];
  tlXs: number[];
  catXs: number[];
}

export function calculateDeptPositions(
  dept: DeptLayout,
  deptCenterX: number,
): DeptPositions {
  // 1. TM 移댄뀒怨좊━ X 醫뚰몴 (湲곗???
  const catXs = computeCategoryXs(deptCenterX, dept.tm.length);

  // 2. TL X 醫뚰몴 (移댄뀒怨좊━ 湲곗?)
  const tlXs = computeTLXs(dept.tl.length, deptCenterX, catXs);

  // 3. GL X 醫뚰몴 (TL 湲곗?)
  const glCount = dept.glCount || (dept.hasGL ? 1 : 0);
  const glXs = computeGLXs(glCount, deptCenterX, tlXs);

  // 4. 遺?쒕챸 X 醫뚰몴
  const deptX = computeDeptNameX(glXs, tlXs, catXs, deptCenterX);

  return { deptX, glXs, tlXs, catXs };
}

/**
 * ?쒖감??GL?뭈L 留ㅽ븨 (?명솚??
 */
export function sequentialGLToTLMapping(
  glCount: number,
  tlCount: number,
): number[][] {
  if (glCount <= 0 || tlCount <= 0) return [];
  const result: number[][] = Array.from({ length: glCount }, () => []);
  const tlsPerGL = Math.ceil(tlCount / glCount);
  for (let t = 0; t < tlCount; t++) {
    const glIdx = Math.floor(t / tlsPerGL);
    if (glIdx < glCount) result[glIdx].push(t);
  }
  return result;
}

/**
 * ?곌껐???ㅼ젙 ?앹꽦 ?ы띁 (?명솚??
 */
export function createEdgeConfig(
  sourceLevel: keyof typeof LAYOUT_CONFIG.Y_POSITIONS,
  targetLevel: keyof typeof LAYOUT_CONFIG.Y_POSITIONS,
  options?: { forceUnifiedBendY?: number },
) {
  if (options?.forceUnifiedBendY !== undefined) {
    return {
      type: "customCenterY" as const,
      data: {
        centerY: options.forceUnifiedBendY,
        offset: LAYOUT_CONFIG.EDGE_OFFSET,
      },
    };
  }

  const bendY = getEdgeBendY(sourceLevel, targetLevel);
  return {
    type: "customCenterY" as const,
    data: { centerY: bendY, offset: LAYOUT_CONFIG.EDGE_OFFSET },
  };
}

/**
 * GL ?곌껐???듭씪??爰얠엫??怨꾩궛 (?명솚??
 */
export function getUnifiedGLBendY(): number {
  return getEdgeBendY("GL", "TL");
}

/**
 * 怨듯넻 ?뷀떚??諛곗튂 怨꾩궛 (?쇱씤/遺???듯빀)
 * ?섏씠吏1???쇱씤怨??섏씠吏2,3??遺?쒕? ?숈씪??濡쒖쭅?쇰줈 泥섎━
 */
export interface EntityPositionsResult {
  positions: number[]; // 媛??뷀떚?곗쓽 以묒떖 X 醫뚰몴
  totalWidth: number; // ?꾩껜 ?덈퉬
  separatedStartX?: number; // 遺꾨━??怨듭젙 ?쒖옉 X (?섏씠吏1留?
}

export function calculateEntityPositions(
  entities: { width: number }[],
  separatedGap?: number,
  entityGap: number = 0,
): EntityPositionsResult {
  const positions: number[] = [];
  let currentX = 0;

  // 媛??뷀떚?곗쓽 以묒떖 X 醫뚰몴 怨꾩궛
  entities.forEach((entity, index) => {
    const centerX = currentX + entity.width / 2;
    positions.push(centerX);
    currentX += entity.width;

    // 留덉?留??뷀떚?곌? ?꾨땲硫?媛꾧꺽 異붽?
    if (index < entities.length - 1) {
      currentX += entityGap;
    }
  });

  const result: EntityPositionsResult = {
    positions,
    totalWidth: currentX,
  };

  // 遺꾨━??怨듭젙???덈뒗 寃쎌슦 (?섏씠吏1留?
  if (separatedGap !== undefined) {
    result.separatedStartX = currentX + separatedGap;
  }

  return result;
}

/**
 * ?쇱씤 ??怨꾩궛 (?듯빀 ?⑥닔 ?ъ슜)
 */
export function calculateLineWidth(processCount: number): number {
  const numGLs = processCount > 0 ? processCount : 1;
  return calculateEntityWidth(numGLs, 300); // ?쇱씤? 理쒖냼 ??300
}
