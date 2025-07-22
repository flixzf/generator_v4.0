// ============================================
// 공통 Spacing 설정 관리 유틸리티
// ============================================

export interface SpacingConfig {
  verticalHierarchy: number;  // 계층 간 수직 간격 (GL-TL-TM)
  horizontalCategory: number; // 부서/카테고리 간 수평 간격  
  innerCategory: number;      // 같은 카테고리 내부 요소 간격
}

// ============================================
// 기본 spacing 값들
// ============================================
export const DEFAULT_SPACING = {
  VERTICAL_HIERARCHY: 48,     // 계층 간 수직 간격 (모든 페이지 공통)
  HORIZONTAL_STANDARD: 96,    // 표준 수평 간격 (Page1, Page3)
  HORIZONTAL_COMPACT: 67,     // 압축 수평 간격 (Page2 - 부서가 많을 때)
  INNER_CATEGORY: 0,          // 내부 요소 간격 (모든 페이지 공통)
} as const;

// ============================================
// 페이지별 spacing 설정 함수
// ============================================

/**
 * Page1용 spacing 설정
 * - LM 그룹 간 표준 간격 사용
 */
export function getPage1SpacingConfig(): SpacingConfig {
  return {
    verticalHierarchy: DEFAULT_SPACING.VERTICAL_HIERARCHY,
    horizontalCategory: DEFAULT_SPACING.HORIZONTAL_STANDARD,
    innerCategory: DEFAULT_SPACING.INNER_CATEGORY,
  };
}

/**
 * Page2용 spacing 설정  
 * - 부서가 많아서 수평 간격을 압축
 */
export function getPage2SpacingConfig(): SpacingConfig {
  return {
    verticalHierarchy: DEFAULT_SPACING.VERTICAL_HIERARCHY,
    horizontalCategory: DEFAULT_SPACING.HORIZONTAL_COMPACT,
    innerCategory: DEFAULT_SPACING.INNER_CATEGORY,
  };
}

/**
 * Page3용 spacing 설정
 * - Page1과 동일한 표준 간격 사용
 */
export function getPage3SpacingConfig(): SpacingConfig {
  return {
    verticalHierarchy: DEFAULT_SPACING.VERTICAL_HIERARCHY,
    horizontalCategory: DEFAULT_SPACING.HORIZONTAL_STANDARD,
    innerCategory: DEFAULT_SPACING.INNER_CATEGORY,
  };
}

/**
 * 커스텀 spacing 설정 생성
 * - 기본값에서 일부만 override 가능
 */
export function createCustomSpacingConfig(
  overrides: Partial<SpacingConfig> = {}
): SpacingConfig {
  return {
    verticalHierarchy: overrides.verticalHierarchy ?? DEFAULT_SPACING.VERTICAL_HIERARCHY,
    horizontalCategory: overrides.horizontalCategory ?? DEFAULT_SPACING.HORIZONTAL_STANDARD,
    innerCategory: overrides.innerCategory ?? DEFAULT_SPACING.INNER_CATEGORY,
  };
}

// ============================================
// Spacing 적용 유틸리티 함수들
// ============================================

/**
 * 수직 간격 스타일 객체 생성
 */
export function getVerticalSpacing(config: SpacingConfig) {
  return {
    marginTop: `${config.verticalHierarchy}px`
  };
}

/**
 * 수평 간격 스타일 객체 생성
 */
export function getHorizontalSpacing(config: SpacingConfig) {
  return {
    gap: `${config.horizontalCategory}px`
  };
}

/**
 * 내부 간격 스타일 객체 생성
 */
export function getInnerSpacing(config: SpacingConfig) {
  return {
    gap: `${config.innerCategory}px`
  };
}

/**
 * 모든 간격을 한번에 적용하는 스타일 객체 생성
 */
export function getAllSpacingStyles(config: SpacingConfig) {
  return {
    vertical: getVerticalSpacing(config),
    horizontal: getHorizontalSpacing(config),
    inner: getInnerSpacing(config),
  };
} 