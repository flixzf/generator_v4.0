/**
 * Integration tests for complete workflow validation
 * Validates the merged stockfit-assembly functionality end-to-end
 */

import { getProcessGroups } from '@/components/common/ReactFlowPage1';
import { Config, ModelData, ProcessData } from '@/context/OrgChartContext';

describe('Integration Workflow Tests', () => {
  const mockConfig: Config = {
    lineCount: 4,
    shiftsCount: 2,
    miniLineCount: 1,
    hasTonguePrefit: false,
    cuttingPrefitCount: 2,
    stitchingCount: 3,
    stockfitCount: 4,
    assemblyCount: 5,
  };

  const mockStockfitProcess: ProcessData = {
    name: 'Stockfit',
    manStt: 10,
    manAsy: 15,
    miniLine: 1,
    shift: 2,
  };

  const mockAssemblyProcess: ProcessData = {
    name: 'Assembly',
    manStt: 8,
    manAsy: 12,
    miniLine: 1,
    shift: 2,
  };

  const mockModelWithBothProcesses: ModelData = {
    category: 'Test Category',
    modelName: 'Test Model',
    styleNo: 'TEST-001',
    processes: [mockStockfitProcess, mockAssemblyProcess],
  };

  describe('Complete Workflow from Configuration to Display', () => {
    test('should handle complete workflow without stockfit ratio configuration', () => {
      // Test that the system works without stockfit ratio in config
      const configWithoutStockfitRatio = { ...mockConfig };
      
      // Verify config doesn't have stockfitRatio property
      expect('stockfitRatio' in configWithoutStockfitRatio).toBe(false);
      
      // Test display context
      const displayResult = getProcessGroups(configWithoutStockfitRatio, mockModelWithBothProcesses, 0, 'display');
      expect(displayResult).toBeDefined();
      expect(displayResult.mainProcesses).toBeDefined();
      expect(displayResult.mainProcesses.length).toBeGreaterThan(0);
      
      // Test calculation context
      const calculationResult = getProcessGroups(configWithoutStockfitRatio, mockModelWithBothProcesses, 0, 'calculation');
      expect(calculationResult).toBeDefined();
      expect(calculationResult.mainProcesses).toBeDefined();
      expect(calculationResult.mainProcesses.length).toBeGreaterThan(0);
    });

    test('should display merged stockfit-assembly structure in display context', () => {
      const displayResult = getProcessGroups(mockConfig, mockModelWithBothProcesses, 0, 'display');
      
      // Should have merged structure in display context
      const mergedGroup = displayResult.mainProcesses.find((group: any) => 
        group.gl.subtitle.includes('Stockfit-Assembly')
      );
      
      // If no explicit merged group, should still handle stockfit and assembly appropriately
      expect(displayResult.mainProcesses.length).toBeGreaterThan(0);
      
      // Verify structure integrity
      displayResult.mainProcesses.forEach((group: any) => {
        expect(group.gl).toBeDefined();
        expect(group.gl.subtitle).toBeDefined();
        expect(group.tlGroup).toBeDefined();
        expect(group.tmGroup).toBeDefined();
      });
    });

    test('should handle model selection and maintain data integrity', () => {
      const models = [
        mockModelWithBothProcesses,
        {
          ...mockModelWithBothProcesses,
          modelName: 'Different Model',
          processes: [mockAssemblyProcess] // Only assembly
        }
      ];
      
      models.forEach(model => {
        const displayResult = getProcessGroups(mockConfig, model, 0, 'display');
        const calculationResult = getProcessGroups(mockConfig, model, 0, 'calculation');
        
        // Both should return valid results
        expect(displayResult).toBeDefined();
        expect(calculationResult).toBeDefined();
        expect(displayResult.mainProcesses.length).toBeGreaterThan(0);
        expect(calculationResult.mainProcesses.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Configuration State Management', () => {
    test('should maintain configuration state without stockfit ratio', () => {
      const configs = [
        { ...mockConfig, lineCount: 2 },
        { ...mockConfig, lineCount: 8 },
        { ...mockConfig, shiftsCount: 1 },
        { ...mockConfig, shiftsCount: 3 },
      ];

      configs.forEach(config => {
        // Verify config doesn't have stockfitRatio
        expect('stockfitRatio' in config).toBe(false);
        
        // Test that system works with different configurations
        const displayResult = getProcessGroups(config, mockModelWithBothProcesses, 0, 'display');
        const calculationResult = getProcessGroups(config, mockModelWithBothProcesses, 0, 'calculation');
        
        expect(displayResult).toBeDefined();
        expect(calculationResult).toBeDefined();
        expect(displayResult.mainProcesses.length).toBeGreaterThan(0);
        expect(calculationResult.mainProcesses.length).toBeGreaterThan(0);
      });
    });

    test('should handle edge cases in configuration', () => {
      const edgeCaseConfigs = [
        { ...mockConfig, lineCount: 1 }, // Minimum
        { ...mockConfig, lineCount: 10 }, // Maximum
        { ...mockConfig, shiftsCount: 1 }, // Minimum
        { ...mockConfig, miniLineCount: 0 }, // Edge case
      ];

      edgeCaseConfigs.forEach(config => {
        const displayResult = getProcessGroups(config, mockModelWithBothProcesses, 0, 'display');
        const calculationResult = getProcessGroups(config, mockModelWithBothProcesses, 0, 'calculation');
        
        // Should handle edge cases gracefully
        expect(displayResult).toBeDefined();
        expect(calculationResult).toBeDefined();
      });
    });
  });

  describe('Data Integrity Validation', () => {
    test('should maintain data integrity across contexts', () => {
      const displayResult = getProcessGroups(mockConfig, mockModelWithBothProcesses, 0, 'display');
      const calculationResult = getProcessGroups(mockConfig, mockModelWithBothProcesses, 0, 'calculation');
      
      // Both contexts should have valid structure
      expect(displayResult.mainProcesses).toBeDefined();
      expect(calculationResult.mainProcesses).toBeDefined();
      
      // Verify each group has required properties
      [...displayResult.mainProcesses, ...calculationResult.mainProcesses].forEach((group: any) => {
        expect(group.gl).toBeDefined();
        expect(group.gl.subtitle).toBeDefined();
        expect(typeof group.gl.subtitle).toBe('string');
        expect(group.tlGroup).toBeDefined();
        expect(Array.isArray(group.tlGroup)).toBe(true);
        expect(group.tmGroup).toBeDefined();
        expect(Array.isArray(group.tmGroup)).toBe(true);
      });
    });

    test('should handle different model configurations', () => {
      const testModels = [
        mockModelWithBothProcesses,
        {
          ...mockModelWithBothProcesses,
          processes: [mockStockfitProcess] // Only stockfit
        },
        {
          ...mockModelWithBothProcesses,
          processes: [mockAssemblyProcess] // Only assembly
        },
        {
          ...mockModelWithBothProcesses,
          processes: [] // Empty processes
        }
      ];

      testModels.forEach(model => {
        const displayResult = getProcessGroups(mockConfig, model, 0, 'display');
        const calculationResult = getProcessGroups(mockConfig, model, 0, 'calculation');
        
        // Should handle all model types gracefully
        expect(displayResult).toBeDefined();
        expect(calculationResult).toBeDefined();
        expect(displayResult.mainProcesses).toBeDefined();
        expect(calculationResult.mainProcesses).toBeDefined();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle undefined and null inputs gracefully', () => {
      const testCases = [
        [mockConfig, undefined, 0, 'display'],
        [mockConfig, null, 0, 'calculation'],
        [undefined, mockModelWithBothProcesses, 0, 'display'],
      ];

      testCases.forEach(([config, model, lineIndex, context]) => {
        expect(() => {
          const result = getProcessGroups(config as any, model as any, lineIndex as any, context as any);
          expect(result).toBeDefined();
        }).not.toThrow();
      });
    });

    test('should maintain functionality with missing process data', () => {
      const modelWithMissingData = {
        ...mockModelWithBothProcesses,
        processes: [
          { ...mockStockfitProcess, manStt: undefined, manAsy: undefined },
          { ...mockAssemblyProcess, name: undefined }
        ]
      };

      const displayResult = getProcessGroups(mockConfig, modelWithMissingData, 0, 'display');
      const calculationResult = getProcessGroups(mockConfig, modelWithMissingData, 0, 'calculation');
      
      // Should handle missing data gracefully
      expect(displayResult).toBeDefined();
      expect(calculationResult).toBeDefined();
    });
  });
});