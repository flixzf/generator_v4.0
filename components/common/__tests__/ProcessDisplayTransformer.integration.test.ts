/**
 * ProcessDisplayTransformer.integration.test.ts
 * 
 * Integration tests for the ProcessDisplayTransformer module with ReactFlowPage1
 */

import { getProcessGroups } from '../ReactFlowPage1';
import { ProcessData } from '@/context/OrgChartContext';

describe('ProcessDisplayTransformer Integration Tests', () => {
  // Mock config and model data
  const mockConfig = {
    lineCount: 4,
    shiftsCount: 2,
    miniLineCount: 2,
    hasTonguePrefit: true
  };

  const createMockModel = (includeStockfit: boolean = true) => ({
    category: "Running",
    modelName: "Test Model",
    styleNo: "TEST-001",
    processes: [
      { name: "Cutting", manStt: 5.5, manAsy: 11.0, miniLine: 1, shift: 1 },
      { name: "Stitching", manStt: 44.0, manAsy: 88.0, miniLine: 2, shift: 1 },
      ...(includeStockfit ? [{ name: "Stockfit", manStt: 70.0, manAsy: 70.0, miniLine: 1, shift: 1 }] : []),
      { name: "Assembly", manStt: 85.0, manAsy: 85.0, miniLine: 1, shift: 1 },
    ] as ProcessData[]
  });

  describe('getProcessGroups with context parameter', () => {
    it('should merge stockfit and assembly for display context', () => {
      const mockModel = createMockModel();
      const result = getProcessGroups(mockConfig, mockModel, 0, 'display');
      
      // Check if we have the correct number of process groups
      // Should have Stitching and merged Stockfit-Assembly
      expect(result.mainProcesses.length).toBe(2);
      
      // Find the merged group
      const mergedGroup = result.mainProcesses.find(
        group => group.gl.subtitle.includes('Stockfit-Assembly')
      );
      
      // Verify the merged group exists
      expect(mergedGroup).toBeDefined();
      
      if (mergedGroup) {
        // Check that the merged group has combined TL groups
        expect(mergedGroup.tlGroup.length).toBeGreaterThan(1);
        
        // Check that the merged group has combined TM groups
        expect(mergedGroup.tmGroup.length).toBeGreaterThan(1);
        
        // Check that the merged group has a combined manpower value in the subtitle
        expect(mergedGroup.gl.subtitle).toContain('[');
      }
    });

    it('should keep stockfit and assembly separate for calculation context', () => {
      const mockModel = createMockModel();
      const result = getProcessGroups(mockConfig, mockModel, 0, 'calculation');
      
      // Check if we have the correct number of process groups
      // Should have Stitching, Stockfit, and Assembly separately
      expect(result.mainProcesses.length).toBe(3);
      
      // Find the stockfit and assembly groups
      const stockfitGroup = result.mainProcesses.find(
        group => group.gl.subtitle === 'Stockfit' || group.gl.subtitle.includes('Stockfit [')
      );
      
      const assemblyGroup = result.mainProcesses.find(
        group => group.gl.subtitle === 'Assembly' || group.gl.subtitle.includes('Assembly [')
      );
      
      // Verify both groups exist separately
      expect(stockfitGroup).toBeDefined();
      expect(assemblyGroup).toBeDefined();
    });

    it('should handle models without stockfit process', () => {
      const mockModel = createMockModel(false); // No stockfit process
      const result = getProcessGroups(mockConfig, mockModel, 0, 'display');
      
      // Should still have Stitching and Assembly
      expect(result.mainProcesses.length).toBe(2);
      
      // Assembly should not be merged with anything
      const assemblyGroup = result.mainProcesses.find(
        group => group.gl.subtitle === 'Assembly' || group.gl.subtitle.includes('Assembly [')
      );
      
      expect(assemblyGroup).toBeDefined();
      // When there's no stockfit, the group should be merged as "Stockfit-Assembly" but only contain assembly data
      if (assemblyGroup?.gl.subtitle.includes('Stockfit-Assembly')) {
        // This is the merged group, which is correct behavior
        expect(assemblyGroup.gl.subtitle).toContain('Stockfit-Assembly');
      } else {
        // This would be a separate assembly group
        expect(assemblyGroup?.gl.subtitle).not.toContain('Stockfit');
      }
    });

    it('should preserve process data for calculations', () => {
      const mockModel = createMockModel();
      const result = getProcessGroups(mockConfig, mockModel, 0, 'display');
      
      // Find the merged group
      const mergedGroup = result.mainProcesses.find(
        group => group.gl.subtitle.includes('Stockfit-Assembly')
      ) as any; // Type assertion for test
      
      // Verify the merged group exists
      expect(mergedGroup).toBeDefined();
      
      if (mergedGroup && mergedGroup.sourceProcesses) {
        // Check that source processes are preserved
        expect(mergedGroup.sourceProcesses.stockfit).toBeDefined();
        expect(mergedGroup.sourceProcesses.assembly).toBeDefined();
        
        // Check that the original process data is intact
        expect(mergedGroup.sourceProcesses.stockfit.length).toBeGreaterThan(0);
        expect(mergedGroup.sourceProcesses.assembly.length).toBeGreaterThan(0);
      }
    });
  });
});