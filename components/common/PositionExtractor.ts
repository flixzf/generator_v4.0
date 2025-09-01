/**
 * Position Extractor Utility
 * 
 * This module provides utilities to extract position data from different pages
 * in a standardized format for validation purposes.
 */

import { CrossPagePosition } from './ValidationEngine';

// Node data structure from ReactFlow components
export interface NodeData {
  title?: string;
  subtitle?: string;
  level?: number;
  colorCategory?: 'direct' | 'indirect' | 'OH' | 'blank';
  department?: string;
  isDeptName?: boolean;
}

export interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}

// Department data structure from OrgChartContext
export interface DepartmentData {
  name: string;
  title?: string[];
  tl?: string[];
  tm?: string[][];
  VSM: number;
  A_VSM: number;
  GL: number;
  TL: number;
  TM: number;
}

/**
 * Extract positions from ReactFlow nodes (used in page components)
 */
export function extractPositionsFromNodes(
  nodes: ReactFlowNode[],
  pageName: string
): CrossPagePosition[] {
  const positions: CrossPagePosition[] = [];

  for (const node of nodes) {
    if (node.type !== 'position' || node.data.isDeptName) {
      continue; // Skip non-position nodes and department name nodes
    }

    const position: CrossPagePosition = {
      id: node.id,
      department: node.data.department || extractDepartmentFromSubtitle(node.data.subtitle),
      level: mapLevelNumberToString(node.data.level),
      title: node.data.title,
      subtitle: node.data.subtitle,
      source: pageName,
      classification: node.data.colorCategory === 'blank' ? undefined : node.data.colorCategory,
      metadata: {
        processName: extractProcessName(node.data.subtitle)
      }
    };

    // Handle separated processes
    if (node.data.subtitle?.includes('No-sew') || node.data.department === 'No-sew') {
      position.processType = 'No-sew';
      position.department = 'No-sew';
    } else if (node.data.subtitle?.includes('HF Welding') || node.data.department === 'HF Welding') {
      position.processType = 'HF Welding';
      position.department = 'HF Welding';
    }

    positions.push(position);
  }

  return positions;
}

/**
 * Extract positions from department data structure (used in aggregation pages)
 */
export function extractPositionsFromDepartments(
  departments: Record<string, DepartmentData>,
  pageName: string,
  includeFilter?: (dept: string, level: string) => boolean
): CrossPagePosition[] {
  const positions: CrossPagePosition[] = [];

  for (const [deptName, dept] of Object.entries(departments)) {
    // Add VSM positions
    for (let i = 0; i < dept.VSM; i++) {
      if (!includeFilter || includeFilter(deptName, 'VSM')) {
        positions.push({
          id: `${deptName}-VSM-${i}`,
          department: deptName,
          level: 'VSM',
          source: pageName
        });
      }
    }

    // Add A.VSM positions
    for (let i = 0; i < dept.A_VSM; i++) {
      if (!includeFilter || includeFilter(deptName, 'A.VSM')) {
        positions.push({
          id: `${deptName}-A.VSM-${i}`,
          department: deptName,
          level: 'A.VSM',
          source: pageName
        });
      }
    }

    // Add GL positions
    for (let i = 0; i < dept.GL; i++) {
      if (!includeFilter || includeFilter(deptName, 'GL')) {
        positions.push({
          id: `${deptName}-GL-${i}`,
          department: deptName,
          level: 'GL',
          source: pageName
        });
      }
    }

    // Add TL positions
    if (dept.tl) {
      dept.tl.forEach((tlName, index) => {
        if (!includeFilter || includeFilter(deptName, 'TL')) {
          positions.push({
            id: `${deptName}-TL-${index}`,
            department: deptName,
            level: 'TL',
            subtitle: tlName,
            source: pageName
          });
        }
      });
    } else {
      // Fallback to count-based TL positions
      for (let i = 0; i < dept.TL; i++) {
        if (!includeFilter || includeFilter(deptName, 'TL')) {
          positions.push({
            id: `${deptName}-TL-${i}`,
            department: deptName,
            level: 'TL',
            source: pageName
          });
        }
      }
    }

    // Add TM positions
    if (dept.tm) {
      dept.tm.forEach((tmGroup, groupIndex) => {
        tmGroup.forEach((tmName, tmIndex) => {
          if (!includeFilter || includeFilter(deptName, 'TM')) {
            positions.push({
              id: `${deptName}-TM-${groupIndex}-${tmIndex}`,
              department: deptName,
              level: 'TM',
              subtitle: tmName,
              source: pageName
            });
          }
        });
      });
    } else {
      // Fallback to count-based TM positions
      for (let i = 0; i < dept.TM; i++) {
        if (!includeFilter || includeFilter(deptName, 'TM')) {
          positions.push({
            id: `${deptName}-TM-${i}`,
            department: deptName,
            level: 'TM',
            source: pageName
          });
        }
      }
    }
  }

  return positions;
}

/**
 * Extract positions from separated processes (No-sew, HF Welding)
 */
export function extractSeparatedProcessPositions(
  lineCount: number,
  shiftsCount: number,
  pageName: string
): CrossPagePosition[] {
  const positions: CrossPagePosition[] = [];

  // Determine which lines have separated processes
  const linesWithNosew = Math.floor(lineCount / 2);
  const linesWithHfWelding = lineCount - linesWithNosew;

  // No-sew positions
  if (linesWithNosew > 0) {
    // GL positions for No-sew
    for (let i = 0; i < shiftsCount; i++) {
      positions.push({
        id: `No-sew-GL-${i}`,
        department: 'No-sew',
        level: 'GL',
        processType: 'No-sew',
        source: pageName
      });
    }

    // TL and TM positions for No-sew
    for (let line = 0; line < linesWithNosew; line++) {
      for (let shift = 0; shift < shiftsCount; shift++) {
        positions.push({
          id: `No-sew-TL-${line}-${shift}`,
          department: 'No-sew',
          level: 'TL',
          processType: 'No-sew',
          source: pageName,
          metadata: { lineIndex: line }
        });

        positions.push({
          id: `No-sew-TM-${line}-${shift}`,
          department: 'No-sew',
          level: 'TM',
          processType: 'No-sew',
          source: pageName,
          metadata: { lineIndex: line }
        });
      }
    }
  }

  // HF Welding positions
  if (linesWithHfWelding > 0) {
    // TL positions for HF Welding
    for (let line = 0; line < linesWithHfWelding; line++) {
      for (let shift = 0; shift < shiftsCount; shift++) {
        positions.push({
          id: `HF-Welding-TL-${line}-${shift}`,
          department: 'HF Welding',
          level: 'TL',
          processType: 'HF Welding',
          source: pageName,
          metadata: { lineIndex: line }
        });
      }
    }

    // TM positions for HF Welding
    const hfTmGroups = 2; // Typically 2 TM groups per shift
    for (let shift = 0; shift < shiftsCount; shift++) {
      for (let group = 0; group < hfTmGroups; group++) {
        positions.push({
          id: `HF-Welding-TM-${shift}-${group}`,
          department: 'HF Welding',
          level: 'TM',
          processType: 'HF Welding',
          source: pageName
        });
      }
    }
  }

  return positions;
}

/**
 * Create filter function for direct positions only
 */
export function createDirectPositionFilter(): (dept: string, level: string) => boolean {
  return (dept: string, level: string) => {
    // Use classification engine to determine if position should be direct
    const { classifyPosition } = require('./ClassificationEngine');
    const classification = classifyPosition(dept, level as any);
    return classification === 'direct';
  };
}

/**
 * Create filter function for indirect/OH positions only
 */
export function createIndirectPositionFilter(): (dept: string, level: string) => boolean {
  return (dept: string, level: string) => {
    // Use classification engine to determine if position should be indirect or OH
    const { classifyPosition } = require('./ClassificationEngine');
    const classification = classifyPosition(dept, level as any);
    return classification === 'indirect' || classification === 'OH';
  };
}

// Helper functions

function extractDepartmentFromSubtitle(subtitle?: string): string {
  if (!subtitle) return 'Unknown';
  
  // Handle common subtitle patterns
  if (subtitle.includes('Plant Manager')) return 'Line';
  if (subtitle.includes('Line Manager')) return 'Line';
  if (subtitle.includes('Admin')) return 'Admin';
  if (subtitle.includes('Quality')) return 'Quality';
  if (subtitle.includes('CE')) return 'CE';
  if (subtitle.includes('No-sew')) return 'No-sew';
  if (subtitle.includes('HF Welding')) return 'HF Welding';
  
  return 'Unknown';
}

function mapLevelNumberToString(level?: number): 'VSM' | 'A.VSM' | 'GL' | 'TL' | 'TM' | 'DEPT' {
  switch (level) {
    case 0: return 'VSM';
    case 1: return 'A.VSM';
    case 2: return 'GL';
    case 3: return 'TL';
    case 4: return 'TM';
    default: return 'DEPT';
  }
}

function extractProcessName(subtitle?: string): string | undefined {
  if (!subtitle) return undefined;
  
  // Extract process names from common subtitle patterns
  if (subtitle.includes('Cutting')) return 'Cutting';
  if (subtitle.includes('Stitching')) return 'Stitching';
  if (subtitle.includes('Stockfit')) return 'Stockfit';
  if (subtitle.includes('Assembly')) return 'Assembly';
  if (subtitle.includes('No-sew')) return 'No-sew';
  if (subtitle.includes('HF Welding')) return 'HF Welding';
  if (subtitle.includes('Mixing')) return 'Mixing';
  if (subtitle.includes('Shipping')) return 'Shipping';
  
  return undefined;
}

/**
 * Utility to merge positions from multiple sources for comprehensive validation
 */
export function mergePositionSources(...positionArrays: CrossPagePosition[][]): CrossPagePosition[] {
  const merged: CrossPagePosition[] = [];
  
  for (const positions of positionArrays) {
    merged.push(...positions);
  }
  
  return merged;
}

/**
 * Utility to deduplicate positions based on department, level, and subtitle
 */
export function deduplicatePositions(positions: CrossPagePosition[]): CrossPagePosition[] {
  const seen = new Set<string>();
  const deduplicated: CrossPagePosition[] = [];
  
  for (const position of positions) {
    const key = `${position.department}-${position.level}-${position.subtitle || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(position);
    }
  }
  
  return deduplicated;
}