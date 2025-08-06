/**
 * Tests for personnel count accuracy with merged display
 * Ensures that merged display shows correct personnel counts
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

const mockModels: ModelData[] = [
  {
    category: "Running",
    modelName: "Vomero 18",
    styleNo: "HM6803-007",
    processes: [
      { name: "Cutting", manStt: 5.5, manAsy: 11.0, miniLine: 1, shift: 1 },
      { name: "Stitching", manStt: 44.0, manAsy: 88.0, miniLine: 2, shift: 1 },
      { name: "Stockfit", manStt: 70.0, manAsy: 70.0, miniLine: 1, shift: 1 },
      { name: "Assembly", manStt: 85.0, manAsy: 85.0, miniLine: 1, shift: 1 },
    ]
  },
  {
    category: "Jordan",
    modelName: "AJ1 Low",
    styleNo: "553558-065",
    processes: [
      { name: "Cutting", manStt: 11.3, manAsy: 22.5, miniLine: 1, shift: 1 },
      { name: "Stitching", manStt: 53.0, manAsy: 106.0, miniLine: 2, shift: 1 },
      { name: "Stockfit", manStt: 21.0, manAsy: 21.0, miniLine: 1, shift: 1 },
      { name: "Assembly", manStt: 94.0, manAsy: 94.0, miniLine: 1, shift: 1 },
    ]
  }
]

// Mock implementation of calculatePositionCount function
function mockCalculatePositionCount(position: string, config: any, models: ModelData[], lineModelSelections: number[]): number {
  if (position === "PM") return 1
  
  if (position === "LM") {
    return Math.ceil(config.lineCount / 2)
  }
  
  let total = 0
  
  lineModelSelections.forEach((modelIndex, lineIndex) => {
    const selectedModel = models[modelIndex]
    if (!selectedModel) return
    
    // Mock getProcessGroups for display context
    const { mainProcesses } = mockGetProcessGroups(config, selectedModel, lineIndex, 'display')
    
    mainProcesses.forEach((group) => {
      if (position === "GL") {
        total += group.gl.count || 1
      } else if (position === "TL") {
        total += group.tlGroup.length
      } else if (position === "TM") {
        total += group.tmGroup?.length || 0
      }
    })
  })
  
  return total
}

// Mock getProcessGroups function
function mockGetProcessGroups(config: any, selectedModel?: ModelData, lineIndex?: number, context: 'display' | 'calculation' = 'display') {
  if (!selectedModel) {
    return { mainProcesses: [], separatedProcesses: [] }
  }

  const allProcesses = selectedModel.processes || []
  
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
    
    if (stockfitProcesses.length > 0 || assemblyProcesses.length > 0) {
      mainProcesses.push({
        gl: { subtitle: "Stockfit-Assembly", count: 1 },
        tlGroup: [...stockfitTLGroup, ...assemblyTLGroup],
        tmGroup: [
          { subtitle: "Stockfit TM", manpower: stockfitProcesses.reduce((sum, p) => sum + p.manAsy, 0) },
          { subtitle: "Assembly TM", manpower: assemblyProcesses.reduce((sum, p) => sum + p.manAsy, 0) }
        ],
        processes: [...stockfitProcesses, ...assemblyProcesses],
        showGL: true,
        sourceProcesses: {
          stockfit: stockfitProcesses,
          assembly: assemblyProcesses
        }
      })
    }
  }

  return { mainProcesses, separatedProcesses: [] }
}

describe('Personnel Count Accuracy', () => {
  describe('Position Count Calculations', () => {
    test('should calculate PM count correctly (always 1)', () => {
      const lineModelSelections = [0, 1, 0, 1] // 4 lines
      const pmCount = mockCalculatePositionCount("PM", mockConfig, mockModels, lineModelSelections)
      
      expect(pmCount).toBe(1)
    })

    test('should calculate LM count correctly (2 lines per LM)', () => {
      const lineModelSelections = [0, 1, 0, 1] // 4 lines
      const lmCount = mockCalculatePositionCount("LM", mockConfig, mockModels, lineModelSelections)
      
      expect(lmCount).toBe(2) // Math.ceil(4/2) = 2
    })

    test('should calculate GL count correctly with merged structure', () => {
      const lineModelSelections = [0, 1, 0, 1] // 4 lines
      const glCount = mockCalculatePositionCount("GL", mockConfig, mockModels, lineModelSelections)
      
      // Each line should have 2 GLs: 1 for Stitching, 1 for merged Stockfit-Assembly
      expect(glCount).toBe(8) // 4 lines * 2 GLs per line
    })

    test('should calculate TL count correctly with merged structure', () => {
      const lineModelSelections = [0, 1, 0, 1] // 4 lines
      const tlCount = mockCalculatePositionCount("TL", mockConfig, mockModels, lineModelSelections)
      
      // Line 0 (Model 0): 1 Stitching TL + 2 merged TLs (1 Stockfit + 1 Assembly) = 3
      // Line 1 (Model 1): 1 Stitching TL + 2 merged TLs (1 Stockfit + 1 Assembly) = 3
      // Line 2 (Model 0): Same as Line 0 = 3
      // Line 3 (Model 1): Same as Line 1 = 3
      // Total: 12 TLs
      expect(tlCount).toBe(12)
    })

    test('should calculate TM count correctly with merged structure', () => {
      const lineModelSelections = [0, 1, 0, 1] // 4 lines
      const tmCount = mockCalculatePositionCount("TM", mockConfig, mockModels, lineModelSelections)
      
      // Each line should have 3 TMs: 1 for Stitching, 2 for merged Stockfit-Assembly
      expect(tmCount).toBe(12) // 4 lines * 3 TMs per line
    })
  })

  describe('Merged Display Accuracy', () => {
    test('should preserve total manpower in merged display', () => {
      const model = mockModels[0] // Vomero 18
      const result = mockGetProcessGroups(mockConfig, model, 0, 'display')
      
      const mergedGroup = result.mainProcesses.find(group => 
        group.gl.subtitle.includes('Stockfit-Assembly')
      )
      
      const stockfitTM = mergedGroup?.tmGroup.find(tm => tm.subtitle === 'Stockfit TM')
      const assemblyTM = mergedGroup?.tmGroup.find(tm => tm.subtitle === 'Assembly TM')
      
      // Original stockfit: 70, assembly: 85
      expect(stockfitTM?.manpower).toBe(70)
      expect(assemblyTM?.manpower).toBe(85)
      
      // Total should be preserved
      const totalMergedManpower = (stockfitTM?.manpower || 0) + (assemblyTM?.manpower || 0)
      expect(totalMergedManpower).toBe(155) // 70 + 85
    })

    test('should maintain accuracy across different models', () => {
      const model1Result = mockGetProcessGroups(mockConfig, mockModels[0], 0, 'display')
      const model2Result = mockGetProcessGroups(mockConfig, mockModels[1], 1, 'display')
      
      // Model 1 (Vomero 18): Stockfit 70 + Assembly 85 = 155
      const merged1 = model1Result.mainProcesses.find(group => 
        group.gl.subtitle.includes('Stockfit-Assembly')
      )
      const total1 = merged1?.sourceProcesses?.stockfit.reduce((sum, p) => sum + p.manAsy, 0) || 0
      const total1Assembly = merged1?.sourceProcesses?.assembly.reduce((sum, p) => sum + p.manAsy, 0) || 0
      
      expect(total1 + total1Assembly).toBe(155)
      
      // Model 2 (AJ1 Low): Stockfit 21 + Assembly 94 = 115
      const merged2 = model2Result.mainProcesses.find(group => 
        group.gl.subtitle.includes('Stockfit-Assembly')
      )
      const total2 = merged2?.sourceProcesses?.stockfit.reduce((sum, p) => sum + p.manAsy, 0) || 0
      const total2Assembly = merged2?.sourceProcesses?.assembly.reduce((sum, p) => sum + p.manAsy, 0) || 0
      
      expect(total2 + total2Assembly).toBe(115)
    })
  })

  describe('Line Configuration Impact', () => {
    test('should scale personnel counts with line count changes', () => {
      const baseLineSelections = [0, 1] // 2 lines
      const extendedLineSelections = [0, 1, 0, 1, 0, 1] // 6 lines
      
      const baseLM = mockCalculatePositionCount("LM", { ...mockConfig, lineCount: 2 }, mockModels, baseLineSelections)
      const extendedLM = mockCalculatePositionCount("LM", { ...mockConfig, lineCount: 6 }, mockModels, extendedLineSelections)
      
      expect(baseLM).toBe(1) // Math.ceil(2/2) = 1
      expect(extendedLM).toBe(3) // Math.ceil(6/2) = 3
      
      const baseGL = mockCalculatePositionCount("GL", { ...mockConfig, lineCount: 2 }, mockModels, baseLineSelections)
      const extendedGL = mockCalculatePositionCount("GL", { ...mockConfig, lineCount: 6 }, mockModels, extendedLineSelections)
      
      expect(baseGL).toBe(4) // 2 lines * 2 GLs per line
      expect(extendedGL).toBe(12) // 6 lines * 2 GLs per line
    })

    test('should handle odd number of lines correctly', () => {
      const oddLineSelections = [0, 1, 0] // 3 lines
      const lmCount = mockCalculatePositionCount("LM", { ...mockConfig, lineCount: 3 }, mockModels, oddLineSelections)
      
      expect(lmCount).toBe(2) // Math.ceil(3/2) = 2
    })
  })

  describe('Data Consistency Validation', () => {
    test('should maintain consistency between display and source data', () => {
      const model = mockModels[0]
      const result = mockGetProcessGroups(mockConfig, model, 0, 'display')
      
      const mergedGroup = result.mainProcesses.find(group => 
        group.gl.subtitle.includes('Stockfit-Assembly')
      )
      
      // Check that source processes match the original model data
      const originalStockfit = model.processes.find(p => p.name.toLowerCase().includes('stockfit'))
      const originalAssembly = model.processes.find(p => p.name.toLowerCase().includes('assembly'))
      
      expect(mergedGroup?.sourceProcesses?.stockfit[0]).toEqual(originalStockfit)
      expect(mergedGroup?.sourceProcesses?.assembly[0]).toEqual(originalAssembly)
    })

    test('should ensure TL and TM counts are consistent', () => {
      const lineModelSelections = [0, 1, 0, 1] // 4 lines
      
      const tlCount = mockCalculatePositionCount("TL", mockConfig, mockModels, lineModelSelections)
      const tmCount = mockCalculatePositionCount("TM", mockConfig, mockModels, lineModelSelections)
      
      // In this mock implementation, TL and TM counts should be equal
      // because each TL group corresponds to a TM group
      expect(tlCount).toBe(tmCount)
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty line model selections', () => {
      const emptySelections: number[] = []
      const glCount = mockCalculatePositionCount("GL", { ...mockConfig, lineCount: 0 }, mockModels, emptySelections)
      
      expect(glCount).toBe(0)
    })

    test('should handle models with missing processes', () => {
      const incompleteModel: ModelData = {
        category: "Incomplete",
        modelName: "Incomplete Model",
        styleNo: "INC-001",
        processes: [
          { name: "Stitching", manStt: 44.0, manAsy: 88.0, miniLine: 2, shift: 1 },
          // Missing stockfit and assembly
        ]
      }
      
      const result = mockGetProcessGroups(mockConfig, incompleteModel, 0, 'display')
      
      // Should only have stitching group
      expect(result.mainProcesses).toHaveLength(1)
      expect(result.mainProcesses[0].gl.subtitle).toBe('Stitching')
    })
  })
})