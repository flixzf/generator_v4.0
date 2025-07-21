/**
 * ProcessDisplayTransformer.ts
 * 
 * This module provides functionality to transform process data for display purposes,
 * specifically merging stockfit and assembly processes while preserving individual process data.
 */

import { ProcessData } from '@/context/OrgChartContext';

// Define types for process groups
export interface ProcessGroup {
  gl: { subtitle: string; count: number };
  tlGroup: Array<{ subtitle: string; manpower?: number }>;
  tmGroup: Array<{ subtitle: string; manpower?: number }>;
  processes?: ProcessData[];
  showGL?: boolean;
}

export interface MergedProcessGroup {
  gl: { subtitle: string; count: number };
  tlGroup: Array<{ subtitle: string; manpower?: number }>;
  tmGroup: Array<{ subtitle: string; manpower?: number }>;
  sourceProcesses: {
    stockfit: ProcessData[];
    assembly: ProcessData[];
  };
  showGL: boolean;
}

/**
 * Merges stockfit and assembly process groups for display purposes
 * while preserving the individual process data for calculations
 * 
 * @param stockfitGroup The stockfit process group
 * @param assemblyGroup The assembly process group
 * @returns A merged process group for display
 */
export function mergeStockfitAssembly(
  stockfitGroup: ProcessGroup,
  assemblyGroup: ProcessGroup
): MergedProcessGroup {
  // Extract processes from both groups
  const stockfitProcesses = stockfitGroup.processes || [];
  const assemblyProcesses = assemblyGroup.processes || [];
  
  // Calculate combined manpower for GL display
  const stockfitManpower = calculateTotalManpower(stockfitProcesses);
  const assemblyManpower = calculateTotalManpower(assemblyProcesses);
  const totalManpower = stockfitManpower + assemblyManpower;
  
  // Create merged GL with combined manpower
  const mergedGl = {
    subtitle: totalManpower > 0 ? `Stockfit-Assembly [${totalManpower}]` : "Stockfit-Assembly",
    count: 1
  };
  
  // Combine TL groups while preserving process-specific information
  const mergedTlGroup = [
    ...stockfitGroup.tlGroup.map(tl => ({
      ...tl,
      subtitle: tl.subtitle.includes('[') 
        ? tl.subtitle 
        : `${tl.subtitle} (Stockfit)`
    })),
    ...assemblyGroup.tlGroup.map(tl => ({
      ...tl,
      subtitle: tl.subtitle.includes('[') 
        ? tl.subtitle 
        : `${tl.subtitle} (Assembly)`
    }))
  ];
  
  // Combine TM groups while preserving process-specific information
  const mergedTmGroup = [
    ...stockfitGroup.tmGroup.map(tm => ({
      ...tm,
      subtitle: tm.subtitle.includes('[') 
        ? tm.subtitle 
        : `${tm.subtitle} (Stockfit)`
    })),
    ...assemblyGroup.tmGroup.map(tm => ({
      ...tm,
      subtitle: tm.subtitle.includes('[') 
        ? tm.subtitle 
        : `${tm.subtitle} (Assembly)`
    }))
  ];
  
  return {
    gl: mergedGl,
    tlGroup: mergedTlGroup,
    tmGroup: mergedTmGroup,
    sourceProcesses: {
      stockfit: stockfitProcesses,
      assembly: assemblyProcesses
    },
    showGL: true
  };
}

/**
 * Calculates the total manpower from a list of processes
 * 
 * @param processes List of process data
 * @returns Total manpower value
 */
export function calculateTotalManpower(processes: ProcessData[]): number {
  return processes.reduce((sum, process) => sum + (process.manAsy || 0), 0);
}

/**
 * Determines if a process group is for display or calculation context
 * 
 * @param context The context in which the process groups are being used
 * @returns Boolean indicating if stockfit and assembly should be merged
 */
export function shouldMergeProcesses(context: 'display' | 'calculation'): boolean {
  return context === 'display';
}

/**
 * Transforms process groups based on the context (display or calculation)
 * 
 * @param processGroups Array of process groups
 * @param context The context in which the process groups are being used
 * @returns Transformed process groups based on context
 */
export function transformProcessGroups(
  processGroups: ProcessGroup[],
  context: 'display' | 'calculation'
): ProcessGroup[] {
  // If this is a calculation context, return the original groups
  if (context === 'calculation') {
    return processGroups;
  }
  
  // For display context, find and merge stockfit and assembly groups
  const stockfitIndex = processGroups.findIndex(
    group => group.gl.subtitle.toLowerCase().includes('stockfit')
  );
  
  const assemblyIndex = processGroups.findIndex(
    group => group.gl.subtitle.toLowerCase().includes('assembly')
  );
  
  // If both stockfit and assembly groups exist, merge them
  if (stockfitIndex !== -1 && assemblyIndex !== -1) {
    const stockfitGroup = processGroups[stockfitIndex];
    const assemblyGroup = processGroups[assemblyIndex];
    
    // Create merged group
    const mergedGroup = mergeStockfitAssembly(stockfitGroup, assemblyGroup);
    
    // Create new array with merged group replacing stockfit and assembly
    const result = [...processGroups];
    result.splice(stockfitIndex, 1); // Remove stockfit
    
    // Adjust assembly index if it comes after stockfit
    const adjustedAssemblyIndex = assemblyIndex > stockfitIndex 
      ? assemblyIndex - 1 
      : assemblyIndex;
    
    result.splice(adjustedAssemblyIndex, 1, mergedGroup); // Replace assembly with merged
    
    return result;
  }
  
  // If we don't have both groups, return original
  return processGroups;
}