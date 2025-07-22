"use client";

import React, { useEffect, useState } from 'react';
import { useOrgChart, ProcessData, ModelData } from '@/context/OrgChartContext';
import { getProcessGroups } from './ReactFlowPage1';
import { validateProcessSeparation, validateManpowerCalculation, validateContextSeparation } from './ProcessDataValidator';

/**
 * This component is used to test and validate that stockfit and assembly processes
 * remain separate in calculation contexts while being merged for display.
 * It's not meant to be rendered in the UI but can be included in development builds
 * to verify data integrity.
 */
export default function ProcessCalculationTest() {
  const { models, config, lineModelSelections } = useOrgChart();
  const [validationResults, setValidationResults] = useState<{
    processSeparation: boolean;
    manpowerCalculation: boolean;
    contextSeparation: boolean;
  }>({
    processSeparation: false,
    manpowerCalculation: false,
    contextSeparation: false
  });

  useEffect(() => {
    // Test 1: Validate process separation in model data
    const processSeparationValid = validateProcessSeparation(models);
    
    // Test 2: Validate manpower calculations
    let manpowerCalculationValid = true;
    
    for (let i = 0; i < config.lineCount; i++) {
      const modelIndex = lineModelSelections[i] || 0;
      const selectedModel = models[modelIndex];
      
      if (selectedModel) {
        // Get display and calculation groups
        const displayGroups = getProcessGroups(config, selectedModel, i, 'display');
        
        // Find the merged Stockfit-Assembly group
        const mergedGroup = displayGroups.mainProcesses.find(
          (group: any) => group.gl?.subtitle?.includes('Stockfit-Assembly')
        );
        
        if (mergedGroup && 'sourceProcesses' in mergedGroup && mergedGroup.sourceProcesses) {
          const { stockfit, assembly } = mergedGroup.sourceProcesses;
          
          // Extract the total manpower from the subtitle (format: "Stockfit-Assembly [X]")
          const subtitleMatch = mergedGroup.gl.subtitle.match(/\\[(\\d+(\\.\\d+)?)\\]/);
          const displayTotal = subtitleMatch ? parseFloat(subtitleMatch[1]) : 0;
          
          // Validate the calculation
          const valid = validateManpowerCalculation(displayTotal, stockfit, assembly);
          if (!valid) {
            manpowerCalculationValid = false;
            break;
          }
        }
      }
    }
    
    // Test 3: Validate context separation
    let contextSeparationValid = true;
    
    for (let i = 0; i < config.lineCount; i++) {
      const modelIndex = lineModelSelections[i] || 0;
      const selectedModel = models[modelIndex];
      
      if (selectedModel) {
        const displayGroups = getProcessGroups(config, selectedModel, i, 'display');
        const calculationGroups = getProcessGroups(config, selectedModel, i, 'calculation');
        
        const valid = validateContextSeparation(displayGroups, calculationGroups);
        if (!valid) {
          contextSeparationValid = false;
          break;
        }
      }
    }
    
    setValidationResults({
      processSeparation: processSeparationValid,
      manpowerCalculation: manpowerCalculationValid,
      contextSeparation: contextSeparationValid
    });
    
    // Log validation results to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Process Data Validation Results:', {
        processSeparation: processSeparationValid,
        manpowerCalculation: manpowerCalculationValid,
        contextSeparation: contextSeparationValid
      });
    }
  }, [models, config, lineModelSelections]);

  // This component doesn't render anything visible
  return null;
}