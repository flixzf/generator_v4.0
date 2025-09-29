/**
 * 부서별 바운딩 박스 계산 유틸리티
 * 각 부서가 차지하는 영역을 계산하고 균등한 간격으로 재배치
 */

import { LAYOUT_CONFIG, DeptPositions, DeptLayout, calculateDeptWidth, calculateDeptPositions, calculateEntityPositions, EntityPositionsResult } from './layout';

/**
 * 부서별 바운딩 박스 정의
 */
export interface DeptBoundingBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * 부서의 바운딩 박스 계산 (부서명부터 최하단 TM까지 모든 요소 포함)
 */
export function calculateDeptBoundingBox(
  deptPositions: DeptPositions,
  tmRowCount: number = 1,
): DeptBoundingBox {
  // 모든 X 좌표들을 수집 (부서명, GL, TL, TM 카테고리)
  const allXs = [
    deptPositions.deptX,
    ...deptPositions.glXs,
    ...deptPositions.tlXs,
    ...deptPositions.catXs,
  ].filter(x => !isNaN(x));

  if (allXs.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
  }

  // 실제 박스 크기를 고려한 바운딩 박스 계산
  const POSITION_BOX_WIDTH = 160; // PositionBox의 실제 너비 (components.tsx에서 확인)
  const BOX_HALF_WIDTH = POSITION_BOX_WIDTH / 2; // 80px

  // X 범위: 가장 좌측 박스의 왼쪽 끝 ~ 가장 우측 박스의 오른쪽 끝
  const leftmostX = Math.min(...allXs);   // 가장 왼쪽 박스의 중심점
  const rightmostX = Math.max(...allXs);  // 가장 오른쪽 박스의 중심점

  const left = leftmostX - BOX_HALF_WIDTH;   // 가장 왼쪽 박스의 왼쪽 경계
  const right = rightmostX + BOX_HALF_WIDTH; // 가장 오른쪽 박스의 오른쪽 경계

  // Y 범위: 부서명(최상단)부터 TM 마지막 행(최하단)까지
  const top = LAYOUT_CONFIG.Y_POSITIONS.DEPT;
  const tmLastRowY = LAYOUT_CONFIG.Y_POSITIONS.TM_BASE +
                     (tmRowCount - 1) * LAYOUT_CONFIG.TM_ROW_SPACING;
  const bottom = tmLastRowY + LAYOUT_CONFIG.BOX_HEIGHT;

  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

/**
 * 부서들의 바운딩 박스를 균등한 간격으로 재배치
 */
export function redistributeDepartmentsBoundingBox(
  deptBoundingBoxes: DeptBoundingBox[],
  targetGap: number = 100,
): number[] {
  if (deptBoundingBoxes.length === 0) return [];
  if (deptBoundingBoxes.length === 1) return [0];

  let currentX = 0;
  const newCenterPositions: number[] = [];

  deptBoundingBoxes.forEach((bbox, index) => {
    // 현재 부서의 중심점을 계산
    const centerX = currentX + bbox.width / 2;
    newCenterPositions.push(centerX);

    // 다음 부서 시작점 계산 (현재 부서 끝 + 간격)
    currentX += bbox.width;
    if (index < deptBoundingBoxes.length - 1) {
      currentX += targetGap;
    }
  });

  return newCenterPositions;
}

/**
 * 부서들을 바운딩 박스 기반으로 균등 간격 배치
 */
export function calculateEntityPositionsWithBoundingBox(
  departments: DeptLayout[],
  targetGap: number = 100,
): EntityPositionsResult {
  if (departments.length === 0) {
    return { positions: [], totalWidth: 0 };
  }

  // 1단계: 기본 배치로 각 부서의 위치 계산
  const deptEntities = departments.map(dept => ({
    width: calculateDeptWidth(dept)
  }));

  const { positions: initialPositions } = calculateEntityPositions(deptEntities, undefined, 50);

  // 2단계: 각 부서의 바운딩 박스 계산
  const boundingBoxes: DeptBoundingBox[] = departments.map((dept, index) => {
    const deptPositions = calculateDeptPositions(dept, initialPositions[index]);
    const tmRowCount = Math.max(1, dept.tm.length);
    return calculateDeptBoundingBox(deptPositions, tmRowCount);
  });

  // 3단계: 바운딩 박스 기반으로 균등 간격 재배치
  const redistributedPositions = redistributeDepartmentsBoundingBox(boundingBoxes, targetGap);

  // 4단계: 전체 너비 계산
  const totalWidth = boundingBoxes.length > 0
    ? Math.max(...redistributedPositions.map((pos, i) => pos + boundingBoxes[i].width / 2))
    : 0;

  return {
    positions: redistributedPositions,
    totalWidth,
  };
}

/**
 * 부서 간 실제 간격 계산 (디버깅용)
 */
export function calculateActualGaps(
  positions: number[],
  boundingBoxes: DeptBoundingBox[],
): number[] {
  const gaps: number[] = [];

  for (let i = 0; i < positions.length - 1; i++) {
    const currentRight = positions[i] + boundingBoxes[i].width / 2;
    const nextLeft = positions[i + 1] - boundingBoxes[i + 1].width / 2;
    gaps.push(nextLeft - currentRight);
  }

  return gaps;
}