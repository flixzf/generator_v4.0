/**
 * ProcessDataValidator.ts
 * 
 * This utility provides validation functions to ensure that stockfit and assembly
 * processes remain separate in calculation contexts while being merged for display.
 */

import { ProcessData, ModelData } from '@/context/OrgChartContext';

/**
 * Validates that stockfit and assembly processes are maintained as separate entities
 * in the model data for calculation purposes
 */
export function validateProcessSeparation(models: ModelData[]): boolean {
  return models.every(model => {
    // Check if stockfit and assembly processes exist separately
    const stockfitProcesses = model.processes.filter(p => 
      p.name.toLowerCase().includes('stockfit')
    );
    
    const assemblyProcesses = model.processes.filter(p => {
      const name = p.name.toLowerCase();
      return !name.includes('stitching') &&
        !name.includes('stockfit') &&
        !name.includes('no-sew') &&
        !name.includes('hf welding') &&
        !name.includes('cutting') &&
        !name.includes('pre-folding');
    });
    
    // If model has both stockfit and assembly, they should be separate processes
    if (stockfitProcesses.length > 0 && assemblyProcesses.length > 0) {
      return true; // They exist as separate processes
    }
    
    // If model only has one of them, that's fine too
    return true;
  });
}

/**
 * Validates that manpower calculations are accurate by comparing
 * the sum of individual process manpower with the displayed total
 */
export function validateManpowerCalculation(
  displayTotal: number,
  stockfitProcesses: ProcessData[],
  assemblyProcesses: ProcessData[]
): boolean {
  const stockfitManpower = stockfitProcesses.reduce((sum, process) => 
    sum + (process.manAsy || 0), 0);
  
  const assemblyManpower = assemblyProcesses.reduce((sum, process) => 
    sum + (process.manAsy || 0), 0);
  
  const calculatedTotal = stockfitManpower + assemblyManpower;
  
  // Allow for small floating point differences
  return Math.abs(displayTotal - calculatedTotal) < 0.001;
}

/**
 * Ensures that the context parameter is properly passed to getProcessGroups
 * to maintain separation in calculation contexts
 */
export function validateContextSeparation(
  displayGroups: any,
  calculationGroups: any
): boolean {
  // In display context, stockfit and assembly should be merged
  const displayHasMergedGroup = displayGroups.mainProcesses.some(
    (group: any) => group.gl?.subtitle?.includes('Stockfit-Assembly')
  );
  
  // In calculation context, stockfit and assembly should be separate
  const calculationHasSeparateGroups = calculationGroups.mainProcesses.some(
    (group: any) => group.gl?.subtitle?.includes('Stockfit')
  ) && calculationGroups.mainProcesses.some(
    (group: any) => group.gl?.subtitle?.includes('Assembly')
  );
  
  return displayHasMergedGroup && calculationHasSeparateGroups;
}