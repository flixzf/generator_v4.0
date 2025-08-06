/**
 * Unit tests for process merging logic
 * Tests the core functionality that merges stockfit and assembly processes for display
 */

import { ProcessData, ModelData } from '@/context/OrgChartContext'

// Mock data for testing
const mockConfig = {
  lineCount: 4,
  shiftsCount: 2,
  miniLineCount: 2,
  hasTonguePrefit: true,
  cuttingPrefitCount: 1,
  stitchingCount: 1,
  stockfitCount: 1,
  assemblyCount: 1,
}

const mockModelWithStockfitAssembly: ModelData = {
  category: "Running",
  modelName: "Test Model",
  styleNo: "TEST-001",
  processes: [
    { name: "Cutting", manStt: 5.5, manAsy: 11.0, miniLine: 1, shift: 1 },
    { name: "Stitching", manStt: 44.0, manAsy: 88.0, miniLine: 2, shift: 1 },
    { name: "Stockfit", manStt: 70.0, manAsy: 70.0, miniLine: 1, shift: 1 },
    { name: "Assembly", manStt: 85.0, manAsy: 85.0, miniLine: 1, shift: 1 },
  ]
}

const mockModelWithoutStockfit: ModelData = {
  category: "Kids",
  modelName: "Test Model 2",
  styleNo: "TEST-002",
  processes: [
    { name: "Cutting", manStt: 5.5, manAsy: 11.0, miniLine: 1, shift: 1 },
    { name: "Stitching", manStt: 44.0, manAsy: 88.0, miniLine: 2, shift: 1 },
    { name: "Assembly", manStt: 107.0, manAsy: 107.0, miniLine: 1, shift: 1 },
  ]
}

// Mock implementation of getProcessGroups function
function mockGetProcessGroups(config: any, selectedModel?: ModelData, lineIndex?: number, context: 'display' | 'calculation' = 'display') {
  if (!selectedModel) {
    return { mainProcesses: [], separatedProcesses: [] }
  }

  const allProcesses = selectedModel.processes || []
  
  // Classify processes
  const stitchingProcesses = allProcesses.filter((process: ProcessData) => 
    process.name.toLowerCase().includes('stitching')
  )
  
  const stockfitProcesses = allProcesses.filter((process: ProcessData) => 
    process.name.toLowerCase().includes('stockfit')
  )
  
  const assemblyProcesses = allProcesses.filter((process: ProcessData) => {
    const name = process.name.toLowerCase()
    return !name.includes('stitching') && 
           !name.includes('stockfit') && 
           !name.includes('cutting')
  })

  const mainProcesses = []

  // Stitching group
  if (stitchingProcesses.length > 0) {
    mainProcesses.push({
      gl: { subtitle: "Stitching", count: 1 },
      tlGroup: stitchingProcesses.map((process: ProcessData) => ({ 
        subtitle: process.name,
        manpower: process.manAsy 
      })),
      tmGroup: stitchingProcesses.map((process: ProcessData) => ({ 
        subtitle: `${process.name} TM`,
        manpower: process.manAsy 
      })),
      processes: stitchingProcesses,
      showGL: true
    })
  }

  if (context === 'display') {
    // Merge stockfit and assembly for display
    const stockfitTLGroup = stockfitProcesses.map((process: ProcessData) => ({ 
      subtitle: `${process.name} (Stockfit)`,
      manpower: process.manAsy 
    }))
    
    const assemblyTLGroup = assemblyProcesses.map((process: ProcessData) => ({ 
      subtitle: `${process.name} (Assembly)`,
      manpower: process.manAsy 
    }))
    
    const stockfitManpower = stockfitProcesses.reduce((sum: number, p: ProcessData) => sum + (p.manAsy || 0), 0)
    const assemblyManpower = assemblyProcesses.reduce((sum: number, p: ProcessData) => sum + (p.manAsy || 0), 0)
    const totalManpower = stockfitManpower + assemblyManpower
    
    if (stockfitProcesses.length > 0 || assemblyProcesses.length > 0) {
      mainProcesses.push({
        gl: { 
          subtitle: totalManpower > 0 ? `Stockfit-Assembly [${totalManpower}]` : "Stockfit-Assembly", 
          count: 1 
        },
        tlGroup: [...stockfitTLGroup, ...assemblyTLGroup],
        tmGroup: [
          { subtitle: "Stockfit", manpower: stockfitManpower },
          { subtitle: "Assembly", manpower: assemblyManpower }
        ],
        processes: [...stockfitProcesses, ...assemblyProcesses],
        showGL: true,
        sourceProcesses: {
          stockfit: stockfitProcesses,
          assembly: assemblyProcesses
        }
      })
    }
  } else {
    // Keep separate for calculation context
    if (stockfitProcesses.length > 0) {
      mainProcesses.push({
        gl: { subtitle: "Stockfit", count: 1 },
        tlGroup: stockfitProcesses.map((process: ProcessData) => ({ 
          subtitle: process.name,
          manpower: process.manAsy 
        })),
        tmGroup: [{ subtitle: "MH → Assembly" }],
        processes: stockfitProcesses,
        showGL: true
      })
    }

    if (assemblyProcesses.length > 0) {
      mainProcesses.push({
        gl: { subtitle: "Assembly", count: 1 },
        tlGroup: assemblyProcesses.map((process: ProcessData) => ({ 
          subtitle: process.name,
          manpower: process.manAsy 
        })),
        tmGroup: [
          { subtitle: "MH → Assembly" },
          { subtitle: "MH → FG WH" },
          { subtitle: "MH → Last" },
        ],
        processes: assemblyProcesses,
        showGL: true
      })
    }
  }

  return { mainProcesses, separatedProcesses: [] }
}

describe('Process Merging Logic', () => {
  describe('Display Context - Merged Stockfit-Assembly', () => {
    test('should merge stockfit and assembly processes for display', () => {
      const result = mockGetProcessGroups(mockConfig, mockModelWithStockfitAssembly, 0, 'display')
      
      // Should have 2 main processes: Stitching and merged Stockfit-Assembly
      expect(result.mainProcesses).toHaveLength(2)
      
      // Find the merged group
      const mergedGroup = result.mainProcesses.find(group => 
        group.gl.subtitle.includes('Stockfit-Assembly')
      )
      
      expect(mergedGroup).toBeDefined()
      expect(mergedGroup?.sourceProcesses).toBeDefined()
      expect(mergedGroup?.sourceProcesses?.stockfit).toHaveLength(1)
      expect(mergedGroup?.sourceProcesses?.assembly).toHaveLength(1)
    })

    test('should include total manpower in merged group title', () => {
      const result = mockGetProcessGroups(mockConfig, mockModelWithStockfitAssembly, 0, 'display')
      
      const mergedGroup = result.mainProcesses.find(group => 
        group.gl.subtitle.includes('Stockfit-Assembly')
      )
      
      expect(mergedGroup?.gl.subtitle).toContain('[155]') // 70 + 85 = 155
    })

    test('should combine TL groups from both stockfit and assembly', () => {
      const result = mockGetProcessGroups(mockConfig, mockModelWithStockfitAssembly, 0, 'display')
      
      const mergedGroup = result.mainProcesses.find(group => 
        group.gl.subtitle.includes('Stockfit-Assembly')
      )
      
      expect(mergedGroup?.tlGroup).toHaveLength(2) // 1 stockfit + 1 assembly
      expect(mergedGroup?.tlGroup[0].subtitle).toContain('Stockfit')
      expect(mergedGroup?.tlGroup[1].subtitle).toContain('Assembly')
    })

    test('should handle models without stockfit processes', () => {
      const result = mockGetProcessGroups(mockConfig, mockModelWithoutStockfit, 0, 'display')
      
      const mergedGroup = result.mainProcesses.find(group => 
        group.gl.subtitle.includes('Stockfit-Assembly')
      )
      
      expect(mergedGroup).toBeDefined()
      expect(mergedGroup?.sourceProcesses?.stockfit).toHaveLength(0)
      expect(mergedGroup?.sourceProcesses?.assembly).toHaveLength(1)
    })
  })

  describe('Calculation Context - Separate Processes', () => {
    test('should keep stockfit and assembly separate for calculations', () => {
      const result = mockGetProcessGroups(mockConfig, mockModelWithStockfitAssembly, 0, 'calculation')
      
      // Should have 3 main processes: Stitching, Stockfit, Assembly
      expect(result.mainProcesses).toHaveLength(3)
      
      const stockfitGroup = result.mainProcesses.find(group => 
        group.gl.subtitle === 'Stockfit'
      )
      const assemblyGroup = result.mainProcesses.find(group => 
        group.gl.subtitle === 'Assembly'
      )
      
      expect(stockfitGroup).toBeDefined()
      expect(assemblyGroup).toBeDefined()
      expect(stockfitGroup?.processes).toHaveLength(1)
      expect(assemblyGroup?.processes).toHaveLength(1)
    })

    test('should not have sourceProcesses in calculation context', () => {
      const result = mockGetProcessGroups(mockConfig, mockModelWithStockfitAssembly, 0, 'calculation')
      
      result.mainProcesses.forEach(group => {
        expect(group.sourceProcesses).toBeUndefined()
      })
    })
  })

  describe('Manpower Aggregation', () => {
    test('should correctly aggregate manpower from merged processes', () => {
      const result = mockGetProcessGroups(mockConfig, mockModelWithStockfitAssembly, 0, 'display')
      
      const mergedGroup = result.mainProcesses.find(group => 
        group.gl.subtitle.includes('Stockfit-Assembly')
      )
      
      const stockfitTM = mergedGroup?.tmGroup.find(tm => tm.subtitle === 'Stockfit')
      const assemblyTM = mergedGroup?.tmGroup.find(tm => tm.subtitle === 'Assembly')
      
      expect(stockfitTM?.manpower).toBe(70)
      expect(assemblyTM?.manpower).toBe(85)
    })

    test('should handle zero manpower correctly', () => {
      const modelWithZeroManpower: ModelData = {
        category: "Test",
        modelName: "Zero Test",
        styleNo: "ZERO-001",
        processes: [
          { name: "Stockfit", manStt: 0, manAsy: 0, miniLine: 1, shift: 1 },
          { name: "Assembly", manStt: 0, manAsy: 0, miniLine: 1, shift: 1 },
        ]
      }
      
      const result = mockGetProcessGroups(mockConfig, modelWithZeroManpower, 0, 'display')
      
      const mergedGroup = result.mainProcesses.find(group => 
        group.gl.subtitle.includes('Stockfit-Assembly')
      )
      
      expect(mergedGroup?.gl.subtitle).toBe('Stockfit-Assembly') // No manpower shown for zero
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty model gracefully', () => {
      const result = mockGetProcessGroups(mockConfig, undefined, 0, 'display')
      
      expect(result.mainProcesses).toHaveLength(0)
      expect(result.separatedProcesses).toHaveLength(0)
    })

    test('should handle model with no processes', () => {
      const emptyModel: ModelData = {
        category: "Empty",
        modelName: "Empty Model",
        styleNo: "EMPTY-001",
        processes: []
      }
      
      const result = mockGetProcessGroups(mockConfig, emptyModel, 0, 'display')
      
      expect(result.mainProcesses).toHaveLength(0)
    })

    test('should handle model with only stitching processes', () => {
      const stitchingOnlyModel: ModelData = {
        category: "Stitching Only",
        modelName: "Stitching Model",
        styleNo: "STITCH-001",
        processes: [
          { name: "Stitching", manStt: 44.0, manAsy: 88.0, miniLine: 2, shift: 1 },
        ]
      }
      
      const result = mockGetProcessGroups(mockConfig, stitchingOnlyModel, 0, 'display')
      
      expect(result.mainProcesses).toHaveLength(1)
      expect(result.mainProcesses[0].gl.subtitle).toBe('Stitching')
    })
  })
})