/**
 * Centralized color category utilities
 * This replaces all the scattered getColorCategory functions across different pages
 */

import { classifyPosition } from './ClassificationEngine';

export type ColorCategory = 'direct' | 'indirect' | 'OH';

/**
 * Get color category for a position using the centralized classification engine
 * This replaces all the duplicate getColorCategory functions
 */
export function getColorCategory(
  deptTitle: string | string[],
  position: 'VSM' | 'A.VSM' | 'GL' | 'TL' | 'TM' | 'DEPT',
  subtitle?: string
): ColorCategory {
  const deptName = Array.isArray(deptTitle) ? deptTitle[0] : deptTitle;
  
  // Use the centralized classification engine with correct parameter order
  // classifyPosition(department, level, processType?, subtitle?, title?)
  return classifyPosition(deptName, position, undefined, subtitle, undefined);
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use getColorCategory instead
 */
export const getPositionColorCategory = getColorCategory;