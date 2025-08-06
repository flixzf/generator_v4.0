/**
 * Validation Integration Tests
 * 
 * Tests the ValidationEngine with realistic data from actual page components
 * to ensure consistency validation works correctly in real-world scenarios.
 */

import { 
  ValidationEngine,
  CrossPagePosition
} from '@/components/common/ValidationEngine';

import { 
  ClassificationEngine, 
  classifyPosition 
} from '@/components/common/ClassificationEngine';

describe('Validation Integration Tests', () => {
  let validationEngine: ValidationEngine;
  let classificationEngine: ClassificationEngine;

  beforeEach(() => {
    classificationEngine = new ClassificationEngine();
    validationEngine = new ValidationEngine(classificationEngine);
    validationEngine.clearPositions();
  });

  describe('Real-world Data Integration', () => {
    test('should validate realistic multi-page data consistency', () => {
      // Page 1 positions (Line-based view)
      const page1Positions: CrossPagePosition[] = [
        { id: 'line-pm', department: 'Line', level: 'PM', title: 'Line PM', source: 'page1' },
        { id: 'line-gl', department: 'Line', level: 'GL', title: 'Line GL', source: 'page1' },
        { id: 'ce-mixing', department: 'CE', level: 'TM', title: 'CE TM', subtitle: 'Mixing', source: 'page1' },
      ];

      // Page 2 positions (Plant departments)
      const page2Positions: CrossPagePosition[] = [
        { id: 'admin-tm', department: 'Admin', level: 'TM', title: 'Admin TM', source: 'page2' },
        { id: 'plant-prod', department: 'Plant Production', level: 'TM', title: 'Plant Production TM', source: 'page2' },
      ];

      // Page 3 positions (Support departments)
      const page3Positions: CrossPagePosition[] = [
        { id: 'tpm-tm', department: 'TPM', level: 'TM', title: 'TPM TM', source: 'page3' },
      ];

      validationEngine.registerPositions('page1', page1Positions);
      validationEngine.registerPositions('page2', page2Positions);
      validationEngine.registerPositions('page3', page3Positions);

      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(6);
      expect(report.summary.pagesCovered).toHaveLength(3);
      
      // Verify classification distribution
      expect(report.summary.classificationCounts.direct).toBe(2); // CE Mixing, Plant Production
      expect(report.summary.classificationCounts.OH).toBe(3); // Line PM, Admin, TPM
      expect(report.summary.classificationCounts.indirect).toBe(1); // Line GL
    });

    test('should validate aggregation pages match detailed views', () => {
      // Detailed positions from various pages
      const detailedPositions: CrossPagePosition[] = [
        { id: 'ce-mixing', department: 'CE', level: 'TM', subtitle: 'Mixing', source: 'page1' },
        { id: 'plant-prod', department: 'Plant Production', level: 'TM', source: 'page2' },
        { id: 'line-gl', department: 'Line', level: 'GL', source: 'page1' },
        { id: 'admin-tm', department: 'Admin', level: 'TM', source: 'page2' },
      ];

      // Create aggregation pages based on classifications
      const directPositions = detailedPositions.filter(p => 
        classifyPosition(p.department, p.level, p.processType, p.subtitle) === 'direct'
      );

      const indirectAndOHPositions = detailedPositions.filter(p => {
        const classification = classifyPosition(p.department, p.level, p.processType, p.subtitle);
        return classification === 'indirect' || classification === 'OH';
      });

      const result = validationEngine.validateAggregation(
        directPositions,
        indirectAndOHPositions,
        detailedPositions
      );

      expect(result.isValid).toBe(true);
      expect(result.directPageTotal).toBe(2); // CE Mixing, Plant Production
      expect(result.indirectPageTotal).toBe(2); // Line GL, Admin
      expect(result.detailedViewTotal).toBe(4);
    });

    test('should detect CE TM classification requirements', () => {
      const positions: CrossPagePosition[] = [
        { id: 'ce-mixing', department: 'CE', level: 'TM', subtitle: 'Mixing', source: 'page1' },
        { id: 'ce-other', department: 'CE', level: 'TM', subtitle: 'Other', source: 'page1' },
      ];

      validationEngine.registerPositions('test', positions);
      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(true);
      expect(report.summary.classificationCounts.direct).toBe(1); // CE Mixing
      expect(report.summary.classificationCounts.OH).toBe(1); // CE Other
    });

    test('should validate separated processes classification', () => {
      const positions: CrossPagePosition[] = [
        { id: 'nosew-gl', department: 'No-sew', level: 'GL', source: 'separated' },
        { id: 'hf-welding-tm', department: 'HF Welding', level: 'TM', source: 'separated' },
      ];

      validationEngine.registerPositions('separated', positions);
      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(true);
      expect(report.summary.classificationCounts.indirect).toBe(2); // Both should be indirect
      expect(report.summary.classificationCounts.direct).toBe(0);
      expect(report.summary.classificationCounts.OH).toBe(0);
    });
  });

  describe('Error Detection', () => {
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

      const page4Positions: CrossPagePosition[] = [
        { 
          id: 'line-pm-4', 
          department: 'Line', 
          level: 'PM', 
          title: 'Line PM', 
          source: 'page4-direct',
          classification: 'direct' // Incorrect
        }
      ];

      validationEngine.registerPositions('page1', page1Positions);
      validationEngine.registerPositions('page4-direct', page4Positions);

      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(false);
      expect(report.inconsistencies.length).toBeGreaterThan(0);
      
      const inconsistency = report.inconsistencies[0];
      expect(inconsistency.department).toBe('Line');
      expect(inconsistency.level).toBe('PM');
      expect(inconsistency.expectedClassification).toBe('OH');
    });

    test('should handle empty datasets gracefully', () => {
      const report = validationEngine.validateConsistency();
      
      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(0);
      expect(report.inconsistencies).toHaveLength(0);
    });
  });

  describe('Performance Tests', () => {
    test('should handle moderate datasets efficiently', () => {
      const positions: CrossPagePosition[] = [];
      const departments = ['Line', 'Quality', 'CE', 'Admin'];
      const levels: Array<'PM' | 'LM' | 'GL' | 'TL' | 'TM'> = ['PM', 'LM', 'GL', 'TL', 'TM'];
      
      // Generate 100 positions
      for (let i = 0; i < 100; i++) {
        positions.push({
          id: `position-${i}`,
          department: departments[i % departments.length],
          level: levels[i % levels.length],
          title: `Position ${i}`,
          source: `page${(i % 3) + 1}`
        });
      }

      const startTime = Date.now();
      validationEngine.registerPositions('performance-test', positions);
      const report = validationEngine.validateConsistency();
      const endTime = Date.now();

      expect(report).toBeDefined();
      expect(report.summary.totalPositions).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});