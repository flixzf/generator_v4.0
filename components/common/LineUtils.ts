/**
 * Centralized line utility functions
 * This replaces all the scattered makeDoubleLines and makeSingleLines functions
 */

/**
 * Generate line pairs like "Line 1-2", "Line 3-4", etc.
 * If odd number, last line is single like "Line 5"
 */
export function makeDoubleLines(count: number, prefix: string = 'Line '): string[] {
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
 * Generate single lines like "Line 1", "Line 2", etc.
 */
export function makeSingleLines(count: number, prefix: string = 'Line '): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);
}

/**
 * Calculate shipping TM count based on line count
 * Used in FG WH department
 */
export function getShippingTMCount(lineCount: number): number {
  if (lineCount <= 8) {
    return [0, 1, 2, 3, 3, 4, 5, 6, 6][lineCount] || 0;
  }
  return Math.ceil(lineCount * 0.75);
}