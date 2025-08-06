/**
 * Comprehensive Validation Tests
 * 
 * This test suite implements task 8 from the data-consistency-fixes spec:
 * - Create unit tests for classification engine covering all department and level combinations
 * - Write integration tests that validate consistency across all pages
 * - Implement aggregation validation tests that verify totals match detailed views
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.5
 */

import { 
  ClassificationEngine, 
  classifyPosition, 
  validatePosition,
  Position 
} from '@/components/common/ClassificationEngine';

import { 
  ValidationEngine,
  CrossPagePosition,
  registerPositions,
  clearValidationData,
  validateConsistency
} from '@/components/common/ValidationEngine';

describe('Comprehensive Validation Tests', () => {
  let classificationEngine: ClassificationEngine;
  let validationEngine: ValidationEngine;

  beforeEach(() => {
    classificationEngine = new ClassificationEngine();
    validationEngine = new ValidationEngine(classificationEngine);
    clearValidationData();
  });

  describe('Unit Tests: Classification Engine - All Department and Level Combinations', () => {
    // Test all known departments with all levels
    const departments = [
      'Line', 'Quality', 'CE', 'Admin', 'Small Tooling',
      'Raw Material', 'Sub Material', 'ACC Market', 'P&L Market', 'Bottom Market',
      'FG WH', 'Plant Production', 'TPM', 'CQM', 'Lean', 'Security', 'RMCC',
      'No-sew', 'HF Welding', 'Separated'
    ];

    const levels: Array<'PM' | 'LM' | 'GL' | 'TL' | 'TM' | 'DEPT'> = ['PM', 'LM', 'GL', 'TL', 'TM', 'DEPT'];

    test('should classify all department-level combinations consistently', () => {
      const results: Record<string, Record<string, string>> = {};
      
      departments.forEach(dept => {
        results[dept] = {};
        levels.forEach(level => {
          const classification = classifyPosition(dept, level);
          results[dept][level] = classification;
          
          // Verify classification is valid
          expect(['direct', 'indirect', 'OH']).toContain(classification);
        });
      });

      // Verify specific requirements are met
      // Requirement 1.4: PM/LM should always be OH (except for separated process departments)
      departments.forEach(dept => {
        if (!['Separated', 'No-sew', 'HF Welding'].includes(dept)) {
          expect(results[dept]['PM']).toBe('OH');
          expect(results[dept]['LM']).toBe('OH');
        }
      });

      // Requirement 1.1: Line department classifications
      expect(results['Line']['GL']).toBe('indirect');
      expect(results['Line']['TL']).toBe('indirect');
      expect(results['Line']['TM']).toBe('indirect');

      // Requirement 1.2: Quality department classifications
      expect(results['Quality']['GL']).toBe('OH');
      expect(results['Quality']['TL']).toBe('indirect');
      expect(results['Quality']['TM']).toBe('indirect');

      // Requirement 1.3: CE department default classifications
      expect(results['CE']['GL']).toBe('OH');
      expect(results['CE']['TL']).toBe('OH');
      expect(results['CE']['TM']).toBe('OH'); // Default, Mixing is exception

      // Administrative departments should be OH
      expect(results['Admin']['TM']).toBe('OH');
      expect(results['Small Tooling']['TM']).toBe('OH');
      expect(results['TPM']['TM']).toBe('OH');
      expect(results['CQM']['TM']).toBe('OH');
      expect(results['Lean']['TM']).toBe('OH');
      expect(results['Security']['TM']).toBe('OH');
      expect(results['RMCC']['TM']).toBe('OH');

      // Material departments
      expect(results['Raw Material']['TM']).toBe('indirect');
      expect(results['Sub Material']['TM']).toBe('OH');

      // Market departments should be indirect
      expect(results['ACC Market']['TM']).toBe('indirect');
      expect(results['P&L Market']['TM']).toBe('indirect');
      expect(results['Bottom Market']['TM']).toBe('indirect');

      // Warehouse
      expect(results['FG WH']['TM']).toBe('indirect');

      // Plant Production TM should be direct
      expect(results['Plant Production']['TM']).toBe('direct');
      expect(results['Plant Production']['GL']).toBe('indirect');
      expect(results['Plant Production']['TL']).toBe('indirect');

      // Separated processes should be indirect
      expect(results['No-sew']['TM']).toBe('indirect');
      expect(results['HF Welding']['TM']).toBe('indirect');
      expect(results['Separated']['TM']).toBe('indirect');
    });

    test('should handle exception rules correctly', () => {
      // CE TM Mixing should be direct (exception)
      expect(classifyPosition('CE', 'TM', undefined, 'Mixing')).toBe('direct');
      expect(classifyPosition('CE', 'TM', undefined, 'Mixing Operations')).toBe('direct');
      
      // FG WH TM Shipping should be OH (exception)
      expect(classifyPosition('FG WH', 'TM', undefined, 'Shipping')).toBe('OH');
      expect(classifyPosition('FG WH', 'TM', undefined, 'Shipping TM 1')).toBe('OH');

      // Process-based exceptions
      expect(classifyPosition('Line', 'TM', 'No-sew')).toBe('indirect');
      expect(classifyPosition('Line', 'TM', 'HF Welding')).toBe('indirect');
    });

    test('should handle department name variations consistently', () => {
      // Test alternative department names
      const variations = [
        ['Raw Material', 'RawMaterial'],
        ['Sub Material', 'SubMaterial'],
        ['ACC Market', 'ACC'],
        ['P&L Market', 'PL'],
        ['Bottom Market', 'BottomMarket'],
        ['FG WH', 'FGWH']
      ];

      variations.forEach(([standard, alternative]) => {
        levels.forEach(level => {
          const standardResult = classifyPosition(standard, level);
          const alternativeResult = classifyPosition(alternative, level);
          expect(standardResult).toBe(alternativeResult);
        });
      });
    });

    test('should validate position objects correctly', () => {
      const testPositions: Position[] = [
        {
          id: 'line-pm',
          department: 'Line',
          level: 'PM',
          title: 'Line PM',
          source: 'page1'
        },
        {
          id: 'ce-tm-mixing',
          department: 'CE',
          level: 'TM',
          title: 'CE TM',
          subtitle: 'Mixing',
          source: 'page1'
        },
        {
          id: 'invalid-dept',
          department: '',
          level: 'TM',
          title: 'Invalid',
          source: 'page1'
        }
      ];

      testPositions.forEach(position => {
        const result = validatePosition(position);
        
        if (position.department === '') {
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('Position department is required');
        } else {
          expect(result.isValid).toBe(true);
          const expectedClassification = classifyPosition(position.department, position.level, position.processType, position.subtitle);
          expect(['direct', 'indirect', 'OH']).toContain(expectedClassification);
        }
      });
    });
  });

  describe('Integration Tests: Cross-Page Consistency Validation', () => {
    test('should detect consistent classifications across pages', () => {
      const page1Positions: CrossPagePosition[] = [
        {
          id: 'line-pm-1',
          department: 'Line',
          level: 'PM',
          title: 'Line PM',
          source: 'page1',
          classification: 'OH'
        },
        {
          id: 'ce-tm-1',
          department: 'CE',
          level: 'TM',
          title: 'CE TM',
          subtitle: 'Mixing',
          source: 'page1',
          classification: 'direct'
        }
      ];

      const page2Positions: CrossPagePosition[] = [
        {
          id: 'line-pm-2',
          department: 'Line',
          level: 'PM',
          title: 'Line PM',
          source: 'page2',
          classification: 'OH'
        },
        {
          id: 'ce-tm-2',
          department: 'CE',
          level: 'TM',
          title: 'CE TM',
          subtitle: 'Mixing',
          source: 'page2',
          classification: 'direct'
        }
      ];

      validationEngine.registerPositions('page1', page1Positions);
      validationEngine.registerPositions('page2', page2Positions);

      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(true);
      expect(report.inconsistencies).toHaveLength(0);
      expect(report.summary.totalPositions).toBe(4);
      expect(report.summary.validPositions).toBe(4);
      expect(report.summary.pagesCovered).toContain('page1');
      expect(report.summary.pagesCovered).toContain('page2');
    });

    test('should detect inconsistent classifications across pages', () => {
      const page1Positions: CrossPagePosition[] = [
        {
          id: 'line-pm-1',
          department: 'Line',
          level: 'PM',
          title: 'Line PM',
          source: 'page1',
          classification: 'OH' // Correct
        }
      ];

      const page2Positions: CrossPagePosition[] = [
        {
          id: 'line-pm-2',
          department: 'Line',
          level: 'PM',
          title: 'Line PM',
          source: 'page2',
          classification: 'direct' // Incorrect - should be OH
        }
      ];

      validationEngine.registerPositions('page1', page1Positions);
      validationEngine.registerPositions('page2', page2Positions);

      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(false);
      expect(report.inconsistencies.length).toBeGreaterThan(0);
      
      const inconsistency = report.inconsistencies[0];
      expect(inconsistency.department).toBe('Line');
      expect(inconsistency.level).toBe('PM');
      expect(inconsistency.expectedClassification).toBe('OH');
      expect(inconsistency.pages).toContain('page1');
      expect(inconsistency.pages).toContain('page2');
    });

    test('should validate all pages with realistic position data', () => {
      // Simulate realistic position data from all pages
      const page1Positions: CrossPagePosition[] = [
        { id: 'line-pm', department: 'Line', level: 'PM', title: 'Line PM', source: 'page1' },
        { id: 'line-lm', department: 'Line', level: 'LM', title: 'Line LM', source: 'page1' },
        { id: 'line-gl', department: 'Line', level: 'GL', title: 'Line GL', source: 'page1' },
        { id: 'quality-gl', department: 'Quality', level: 'GL', title: 'Quality GL', source: 'page1' },
        { id: 'ce-tm-mixing', department: 'CE', level: 'TM', title: 'CE TM', subtitle: 'Mixing', source: 'page1' }
      ];

      const page2Positions: CrossPagePosition[] = [
        { id: 'admin-tm', department: 'Admin', level: 'TM', title: 'Admin TM', source: 'page2' },
        { id: 'raw-material-tm', department: 'Raw Material', level: 'TM', title: 'Raw Material TM', source: 'page2' },
        { id: 'acc-market-tm', department: 'ACC Market', level: 'TM', title: 'ACC Market TM', source: 'page2' }
      ];

      const page3Positions: CrossPagePosition[] = [
        { id: 'tpm-tm', department: 'TPM', level: 'TM', title: 'TPM TM', source: 'page3' },
        { id: 'security-tm', department: 'Security', level: 'TM', title: 'Security TM', source: 'page3' }
      ];

      const separatedPositions: CrossPagePosition[] = [
        { id: 'nosew-gl', department: 'No-sew', level: 'GL', title: 'No-sew GL', source: 'separated' },
        { id: 'hf-welding-tm', department: 'HF Welding', level: 'TM', title: 'HF Welding TM', source: 'separated' }
      ];

      validationEngine.registerPositions('page1', page1Positions);
      validationEngine.registerPositions('page2', page2Positions);
      validationEngine.registerPositions('page3', page3Positions);
      validationEngine.registerPositions('separated', separatedPositions);

      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(12);
      expect(report.summary.pagesCovered).toHaveLength(4);
      
      // Verify classification counts
      expect(report.summary.classificationCounts.direct).toBeGreaterThan(0); // CE TM Mixing
      expect(report.summary.classificationCounts.indirect).toBeGreaterThan(0); // Line GL, Raw Material, etc.
      expect(report.summary.classificationCounts.OH).toBeGreaterThan(0); // PM, LM, Admin, etc.
    });

    test('should handle separated processes correctly in cross-page validation', () => {
      const page1Positions: CrossPagePosition[] = [
        { id: 'nosew-process', department: 'Line', level: 'TM', processType: 'No-sew', source: 'page1' }
      ];

      const separatedPositions: CrossPagePosition[] = [
        { id: 'nosew-dept', department: 'No-sew', level: 'TM', source: 'separated' }
      ];

      validationEngine.registerPositions('page1', page1Positions);
      validationEngine.registerPositions('separated', separatedPositions);

      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(true);
      // Both should be classified as indirect
      expect(report.summary.classificationCounts.indirect).toBe(2);
    });
  });

  describe('Aggregation Validation Tests: Totals Match Detailed Views', () => {
    test('should validate direct aggregation page matches detailed views', () => {
      // Create detailed positions with known classifications
      const detailedPositions: CrossPagePosition[] = [
        { id: 'ce-mixing', department: 'CE', level: 'TM', subtitle: 'Mixing', source: 'page1' }, // direct
        { id: 'plant-prod', department: 'Plant Production', level: 'TM', source: 'page1' }, // direct
        { id: 'line-gl', department: 'Line', level: 'GL', source: 'page1' }, // indirect
        { id: 'admin-tm', department: 'Admin', level: 'TM', source: 'page2' }, // OH
        { id: 'quality-gl', department: 'Quality', level: 'GL', source: 'page2' } // OH
      ];

      // Direct page should only contain direct positions
      const directPagePositions: CrossPagePosition[] = [
        { id: 'ce-mixing-agg', department: 'CE', level: 'TM', subtitle: 'Mixing', source: 'page4-direct' },
        { id: 'plant-prod-agg', department: 'Plant Production', level: 'TM', source: 'page4-direct' }
      ];

      // Indirect page should contain indirect + OH positions
      const indirectPagePositions: CrossPagePosition[] = [
        { id: 'line-gl-agg', department: 'Line', level: 'GL', source: 'page4-indirect' },
        { id: 'admin-tm-agg', department: 'Admin', level: 'TM', source: 'page4-indirect' },
        { id: 'quality-gl-agg', department: 'Quality', level: 'GL', source: 'page4-indirect' }
      ];

      const result = validationEngine.validateAggregation(
        directPagePositions,
        indirectPagePositions,
        detailedPositions
      );

      expect(result.isValid).toBe(true);
      expect(result.directPageTotal).toBe(2);
      expect(result.indirectPageTotal).toBe(3);
      expect(result.detailedViewTotal).toBe(5);
      expect(result.mismatches).toHaveLength(0);
    });

    test('should detect aggregation mismatches', () => {
      const detailedPositions: CrossPagePosition[] = [
        { id: 'ce-mixing', department: 'CE', level: 'TM', subtitle: 'Mixing', source: 'page1' }, // direct
        { id: 'line-gl', department: 'Line', level: 'GL', source: 'page1' } // indirect
      ];

      // Direct page incorrectly includes an indirect position
      const directPagePositions: CrossPagePosition[] = [
        { id: 'ce-mixing-agg', department: 'CE', level: 'TM', subtitle: 'Mixing', source: 'page4-direct' },
        { id: 'line-gl-wrong', department: 'Line', level: 'GL', source: 'page4-direct' } // Wrong page!
      ];

      const indirectPagePositions: CrossPagePosition[] = [];

      const result = validationEngine.validateAggregation(
        directPagePositions,
        indirectPagePositions,
        detailedPositions
      );

      expect(result.isValid).toBe(false);
      expect(result.mismatches.length).toBeGreaterThan(0);
      
      // Should detect that Line GL is in wrong aggregation page
      const mismatch = result.mismatches.find(m => 
        m.department === 'Line' && m.level === 'GL'
      );
      expect(mismatch).toBeDefined();
    });

    test('should validate CE TM positions appear in correct aggregation pages', () => {
      // Requirement 2.3: CE TM Mixing should be in direct page, others in indirect
      const detailedPositions: CrossPagePosition[] = [
        { id: 'ce-mixing', department: 'CE', level: 'TM', subtitle: 'Mixing', source: 'page1' }, // direct
        { id: 'ce-other', department: 'CE', level: 'TM', subtitle: 'Other', source: 'page1' } // OH
      ];

      const directPagePositions: CrossPagePosition[] = [
        { id: 'ce-mixing-agg', department: 'CE', level: 'TM', subtitle: 'Mixing', source: 'page4-direct' }
      ];

      const indirectPagePositions: CrossPagePosition[] = [
        { id: 'ce-other-agg', department: 'CE', level: 'TM', subtitle: 'Other', source: 'page4-indirect' }
      ];

      const result = validationEngine.validateAggregation(
        directPagePositions,
        indirectPagePositions,
        detailedPositions
      );

      expect(result.isValid).toBe(true);
      expect(result.directPageTotal).toBe(1);
      expect(result.indirectPageTotal).toBe(1);
    });

    test('should validate separated processes aggregation', () => {
      // Requirement 2.2: Separated processes should be in indirect page
      const detailedPositions: CrossPagePosition[] = [
        { id: 'nosew-gl', department: 'No-sew', level: 'GL', source: 'separated' }, // indirect
        { id: 'hf-welding-tm', department: 'HF Welding', level: 'TM', source: 'separated' }, // indirect
        { id: 'plant-prod', department: 'Plant Production', level: 'TM', source: 'page1' } // direct
      ];

      const directPagePositions: CrossPagePosition[] = [
        { id: 'plant-prod-agg', department: 'Plant Production', level: 'TM', source: 'page4-direct' }
      ];

      const indirectPagePositions: CrossPagePosition[] = [
        { id: 'nosew-gl-agg', department: 'No-sew', level: 'GL', source: 'page4-indirect' },
        { id: 'hf-welding-tm-agg', department: 'HF Welding', level: 'TM', source: 'page4-indirect' }
      ];

      const result = validationEngine.validateAggregation(
        directPagePositions,
        indirectPagePositions,
        detailedPositions
      );

      expect(result.isValid).toBe(true);
      expect(result.directPageTotal).toBe(1);
      expect(result.indirectPageTotal).toBe(2);
    });

    test('should validate total personnel count consistency', () => {
      // Requirement 2.4: Sum of Direct + Indirect + OH should equal total
      const detailedPositions: CrossPagePosition[] = [
        { id: 'direct-1', department: 'Plant Production', level: 'TM', source: 'page1' }, // direct
        { id: 'direct-2', department: 'CE', level: 'TM', subtitle: 'Mixing', source: 'page1' }, // direct
        { id: 'indirect-1', department: 'Line', level: 'GL', source: 'page1' }, // indirect
        { id: 'indirect-2', department: 'Raw Material', level: 'TM', source: 'page2' }, // indirect
        { id: 'oh-1', department: 'Line', level: 'PM', source: 'page1' }, // OH
        { id: 'oh-2', department: 'Admin', level: 'TM', source: 'page2' } // OH
      ];

      const directPagePositions = detailedPositions.filter(p => 
        classifyPosition(p.department, p.level, p.processType, p.subtitle) === 'direct'
      );

      const indirectPagePositions = detailedPositions.filter(p => {
        const classification = classifyPosition(p.department, p.level, p.processType, p.subtitle);
        return classification === 'indirect' || classification === 'OH';
      });

      const result = validationEngine.validateAggregation(
        directPagePositions,
        indirectPagePositions,
        detailedPositions
      );

      expect(result.isValid).toBe(true);
      expect(result.directPageTotal + result.indirectPageTotal).toBe(result.detailedViewTotal);
      expect(result.detailedViewTotal).toBe(6);
    });
  });

  describe('Comprehensive End-to-End Validation', () => {
    test('should validate complete application data consistency', () => {
      // Simulate complete application data across all pages
      const allPositions = {
        page1: [
          { id: 'line-pm', department: 'Line', level: 'PM' as const, source: 'page1' },
          { id: 'line-lm', department: 'Line', level: 'LM' as const, source: 'page1' },
          { id: 'line-gl-1', department: 'Line', level: 'GL' as const, source: 'page1' },
          { id: 'line-gl-2', department: 'Line', level: 'GL' as const, source: 'page1' },
          { id: 'quality-gl', department: 'Quality', level: 'GL' as const, source: 'page1' },
          { id: 'quality-tl', department: 'Quality', level: 'TL' as const, source: 'page1' },
          { id: 'ce-tm-mixing', department: 'CE', level: 'TM' as const, subtitle: 'Mixing', source: 'page1' }
        ],
        page2: [
          { id: 'admin-tm', department: 'Admin', level: 'TM' as const, source: 'page2' },
          { id: 'raw-material-tm', department: 'Raw Material', level: 'TM' as const, source: 'page2' },
          { id: 'acc-market-tm', department: 'ACC Market', level: 'TM' as const, source: 'page2' },
          { id: 'plant-prod-tm', department: 'Plant Production', level: 'TM' as const, source: 'page2' }
        ],
        page3: [
          { id: 'tpm-tm', department: 'TPM', level: 'TM' as const, source: 'page3' },
          { id: 'security-tm', department: 'Security', level: 'TM' as const, source: 'page3' }
        ],
        separated: [
          { id: 'nosew-gl', department: 'No-sew', level: 'GL' as const, source: 'separated' },
          { id: 'hf-welding-tm', department: 'HF Welding', level: 'TM' as const, source: 'separated' }
        ]
      };

      // Register all positions
      Object.entries(allPositions).forEach(([pageName, positions]) => {
        validationEngine.registerPositions(pageName, positions);
      });

      // Validate consistency
      const consistencyReport = validationEngine.validateConsistency();
      expect(consistencyReport.isValid).toBe(true);
      expect(consistencyReport.summary.totalPositions).toBe(15);

      // Create aggregation pages based on classifications
      const allDetailedPositions = Object.values(allPositions).flat();
      const directPositions = allDetailedPositions.filter(p => 
        classifyPosition(p.department, p.level, p.processType, p.subtitle) === 'direct'
      );
      const indirectAndOHPositions = allDetailedPositions.filter(p => {
        const classification = classifyPosition(p.department, p.level, p.processType, p.subtitle);
        return classification === 'indirect' || classification === 'OH';
      });

      // Validate aggregation
      const aggregationReport = validationEngine.validateAggregation(
        directPositions,
        indirectAndOHPositions,
        allDetailedPositions
      );

      expect(aggregationReport.isValid).toBe(true);
      expect(aggregationReport.directPageTotal + aggregationReport.indirectPageTotal)
        .toBe(aggregationReport.detailedViewTotal);

      // Verify specific requirements
      // CE TM Mixing should be in direct
      expect(directPositions.some(p => 
        p.department === 'CE' && p.level === 'TM' && p.subtitle === 'Mixing'
      )).toBe(true);

      // Plant Production TM should be in direct
      expect(directPositions.some(p => 
        p.department === 'Plant Production' && p.level === 'TM'
      )).toBe(true);

      // No-sew and HF Welding should be in indirect
      expect(indirectAndOHPositions.some(p => p.department === 'No-sew')).toBe(true);
      expect(indirectAndOHPositions.some(p => p.department === 'HF Welding')).toBe(true);

      // PM/LM should be in indirect (OH)
      expect(indirectAndOHPositions.some(p => p.level === 'PM')).toBe(true);
      expect(indirectAndOHPositions.some(p => p.level === 'LM')).toBe(true);
    });

    test('should generate detailed validation report with department and level analysis', () => {
      const positions = [
        { id: 'line-pm', department: 'Line', level: 'PM' as const, source: 'page1' },
        { id: 'line-gl', department: 'Line', level: 'GL' as const, source: 'page1' },
        { id: 'quality-gl', department: 'Quality', level: 'GL' as const, source: 'page1' },
        { id: 'admin-tm', department: 'Admin', level: 'TM' as const, source: 'page2' }
      ];

      validationEngine.registerPositions('test', positions);
      const detailedReport = validationEngine.generateDetailedReport();

      expect(detailedReport.departmentAnalysis).toBeDefined();
      expect(detailedReport.levelAnalysis).toBeDefined();

      // Check department analysis
      expect(detailedReport.departmentAnalysis['Line']).toBeDefined();
      expect(detailedReport.departmentAnalysis['Line'].totalPositions).toBe(2);
      expect(detailedReport.departmentAnalysis['Quality']).toBeDefined();
      expect(detailedReport.departmentAnalysis['Admin']).toBeDefined();

      // Check level analysis
      expect(detailedReport.levelAnalysis['PM']).toBeDefined();
      expect(detailedReport.levelAnalysis['GL']).toBeDefined();
      expect(detailedReport.levelAnalysis['TM']).toBeDefined();
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large datasets efficiently', () => {
      const largeDataset: CrossPagePosition[] = [];
      const testDepartments = ['Line', 'Quality', 'CE', 'Admin', 'Raw Material'];
      const testLevels: Array<'PM' | 'LM' | 'GL' | 'TL' | 'TM'> = ['PM', 'LM', 'GL', 'TL', 'TM'];
      
      // Generate 1000 positions
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          id: `position-${i}`,
          department: testDepartments[i % testDepartments.length],
          level: testLevels[i % testLevels.length],
          source: `page${(i % 4) + 1}`
        });
      }

      const startTime = Date.now();
      validationEngine.registerPositions('large-test', largeDataset);
      const report = validationEngine.validateConsistency();
      const endTime = Date.now();

      expect(report).toBeDefined();
      expect(report.summary.totalPositions).toBe(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle empty datasets gracefully', () => {
      const report = validationEngine.validateConsistency();
      
      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(0);
      expect(report.inconsistencies).toHaveLength(0);
    });

    test('should handle malformed position data', () => {
      const malformedPositions: CrossPagePosition[] = [
        { id: '', department: '', level: 'TM' as const, source: 'test' },
        { id: 'test', department: 'Unknown Dept', level: 'TM' as const, source: 'test' }
      ];

      validationEngine.registerPositions('malformed', malformedPositions);
      const report = validationEngine.validateConsistency();

      expect(report).toBeDefined();
      // Should handle gracefully without throwing errors
    });
  });
});