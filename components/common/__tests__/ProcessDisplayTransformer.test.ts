/**
 * ProcessDisplayTransformer.test.ts
 * 
 * Unit tests for the ProcessDisplayTransformer module
 */

import { 
  mergeStockfitAssembly, 
  calculateTotalManpower,
  shouldMergeProcesses,
  transformProcessGroups,
  ProcessGroup
} from '../ProcessDisplayTransformer';

describe('ProcessDisplayTransformer', () => {
  // Sample process data for testing
  const mockStockfitGroup: ProcessGroup = {
    gl: { subtitle: "Stockfit", count: 1 },
    tlGroup: [{ subtitle: "Stockfit", manpower: 20 }],
    tmGroup: [{ subtitle: "Stockfit", manpower: 20 }],
    processes: [
      { name: "Stockfit", manStt: 20, manAsy: 20, miniLine: 1, shift: 1 }
    ],
    showGL: true
  };

  const mockAssemblyGroup: ProcessGroup = {
    gl: { subtitle: "Assembly [30]", count: 1 },
    tlGroup: [
      { subtitle: "Input", manpower: 10 },
      { subtitle: "Cementing", manpower: 10 },
      { subtitle: "Finishing", manpower: 10 }
    ],
    tmGroup: [
      { subtitle: "Assembly", manpower: 15 },
      { subtitle: "Assembly Last", manpower: 15 }
    ],
    processes: [
      { name: "Assembly", manStt: 30, manAsy: 30, miniLine: 1, shift: 1 }
    ],
    showGL: true
  };

  describe('mergeStockfitAssembly', () => {
    it('should merge stockfit and assembly groups correctly', () => {
      const result = mergeStockfitAssembly(mockStockfitGroup, mockAssemblyGroup);
      
      // Check GL merging
      expect(result.gl.subtitle).toBe("Stockfit-Assembly [50]");
      expect(result.gl.count).toBe(1);
      
      // Check TL groups are combined
      expect(result.tlGroup.length).toBe(4); // 1 from stockfit + 3 from assembly
      expect(result.tlGroup[0].subtitle).toBe("Stockfit (Stockfit)");
      expect(result.tlGroup[1].subtitle).toBe("Input (Assembly)");
      
      // Check TM groups are combined
      expect(result.tmGroup.length).toBe(3); // 1 from stockfit + 2 from assembly
      expect(result.tmGroup[0].subtitle).toBe("Stockfit (Stockfit)");
      expect(result.tmGroup[1].subtitle).toBe("Assembly (Assembly)");
      
      // Check source processes are preserved
      expect(result.sourceProcesses.stockfit).toEqual(mockStockfitGroup.processes);
      expect(result.sourceProcesses.assembly).toEqual(mockAssemblyGroup.processes);
    });
    
    it('should handle groups without manpower values', () => {
      const stockfitWithoutManpower = {
        ...mockStockfitGroup,
        processes: [{ name: "Stockfit", manStt: 0, manAsy: 0, miniLine: 1, shift: 1 }]
      };
      
      const assemblyWithoutManpower = {
        ...mockAssemblyGroup,
        processes: [{ name: "Assembly", manStt: 0, manAsy: 0, miniLine: 1, shift: 1 }]
      };
      
      const result = mergeStockfitAssembly(stockfitWithoutManpower, assemblyWithoutManpower);
      
      expect(result.gl.subtitle).toBe("Stockfit-Assembly");
    });
  });

  describe('calculateTotalManpower', () => {
    it('should calculate total manpower correctly', () => {
      const processes = [
        { name: "Process1", manStt: 10, manAsy: 15, miniLine: 1, shift: 1 },
        { name: "Process2", manStt: 5, manAsy: 10, miniLine: 1, shift: 1 }
      ];
      
      const result = calculateTotalManpower(processes);
      expect(result).toBe(25); // 15 + 10
    });
    
    it('should handle empty process list', () => {
      const result = calculateTotalManpower([]);
      expect(result).toBe(0);
    });
    
    it('should handle undefined manAsy values', () => {
      const processes = [
        { name: "Process1", manStt: 10, manAsy: undefined, miniLine: 1, shift: 1 },
        { name: "Process2", manStt: 5, manAsy: 10, miniLine: 1, shift: 1 }
      ];
      
      const result = calculateTotalManpower(processes);
      expect(result).toBe(10); // 0 + 10
    });
  });

  describe('shouldMergeProcesses', () => {
    it('should return true for display context', () => {
      expect(shouldMergeProcesses('display')).toBe(true);
    });
    
    it('should return false for calculation context', () => {
      expect(shouldMergeProcesses('calculation')).toBe(false);
    });
  });

  describe('transformProcessGroups', () => {
    const mockProcessGroups = [
      { 
        gl: { subtitle: "Stitching", count: 1 },
        tlGroup: [{ subtitle: "Stitching" }],
        tmGroup: [{ subtitle: "Stitching TM" }],
        showGL: true
      },
      mockStockfitGroup,
      mockAssemblyGroup
    ];
    
    it('should merge stockfit and assembly for display context', () => {
      const result = transformProcessGroups(mockProcessGroups, 'display');
      
      // Should have 2 groups now (Stitching and merged Stockfit-Assembly)
      expect(result.length).toBe(2);
      
      // First group should still be Stitching
      expect(result[0].gl.subtitle).toBe("Stitching");
      
      // Second group should be merged
      expect(result[1].gl.subtitle).toBe("Stockfit-Assembly [50]");
    });
    
    it('should not merge for calculation context', () => {
      const result = transformProcessGroups(mockProcessGroups, 'calculation');
      
      // Should still have 3 separate groups
      expect(result.length).toBe(3);
      expect(result[0].gl.subtitle).toBe("Stitching");
      expect(result[1].gl.subtitle).toBe("Stockfit");
      expect(result[2].gl.subtitle).toBe("Assembly [30]");
    });
    
    it('should handle missing stockfit or assembly groups', () => {
      // Only stockfit, no assembly
      const onlyStockfit = [
        { 
          gl: { subtitle: "Stitching", count: 1 },
          tlGroup: [{ subtitle: "Stitching" }],
          tmGroup: [{ subtitle: "Stitching TM" }],
          showGL: true
        },
        mockStockfitGroup
      ];
      
      const result = transformProcessGroups(onlyStockfit, 'display');
      
      // Should not merge anything
      expect(result.length).toBe(2);
      expect(result[1].gl.subtitle).toBe("Stockfit");
    });
  });
});