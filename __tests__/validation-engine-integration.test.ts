/**
 * Validation Engine Integration Tests
 * 
 * Tests the ValidationEngine with realistic data from actual page components
 * to ensure consistency validation works correctly in real-world scenarios.
 */

import { 
  ValidationEngine,
  CrossPagePosition,
  registerPositions,
  clearValidationData,
  validateConsistency
} from '@/components/common/ValidationEngine';

import { 
  ClassificationEngine, 
  classifyPosition 
} from '@/components/common/ClassificationEngine';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import { describe } from 'node:test';
import test from 'node:test';
import test from 'node:test';
import { describe } from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import { describe } from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import { describe } from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

describe('Validation Engine Integration Tests', () => {
  let validationEngine: ValidationEngine;
  let classificationEngine: ClassificationEngine;

  beforeEach(() => {
    classificationEngine = new ClassificationEngine();
    validationEngine = new ValidationEngine(classificationEngine);
    clearValidationData();
  });

  describe('Real-world Page Data Integration', () => {
    test('should validate realistic Page1 data with Line departments', () => {
      const page1Positions: CrossPagePosition[] = [
        // Line department hierarchy
        { id: 'line-pm', department: 'Line', level: 'PM', title: 'Line PM', source: 'page1' },
        { id: 'line-lm', department: 'Line', level: 'LM', title: 'Line LM', source: 'page1' },
        { id: 'line-gl-1', department: 'Line', level: 'GL', title: 'Line GL 1', subtitle: 'Stitching', source: 'page1' },
        { id: 'line-gl-2', department: 'Line', level: 'GL', title: 'Line GL 2', subtitle: 'Lasting', source: 'page1' },
        { id: 'line-tl-1', department: 'Line', level: 'TL', title: 'Line TL 1', subtitle: 'Stitching TL', source: 'page1' },
        { id: 'line-tl-2', department: 'Line', level: 'TL', title: 'Line TL 2', subtitle: 'Lasting TL', source: 'page1' },
        { id: 'line-tm-1', department: 'Line', level: 'TM', title: 'Line TM 1', subtitle: 'Stitching TM', source: 'page1' },
        { id: 'line-tm-2', department: 'Line', level: 'TM', title: 'Line TM 2', subtitle: 'Lasting TM', source: 'page1' },
        
        // Quality department
        { id: 'quality-gl', department: 'Quality', level: 'GL', title: 'Quality GL', source: 'page1' },
        { id: 'quality-tl', department: 'Quality', level: 'TL', title: 'Quality TL', source: 'page1' },
        { id: 'quality-tm', department: 'Quality', level: 'TM', title: 'Quality TM', source: 'page1' },
        
        // CE department with mixing exception
        { id: 'ce-tm-mixing', department: 'CE', level: 'TM', title: 'CE TM', subtitle: 'Mixing', source: 'page1' },
        { id: 'ce-tm-other', department: 'CE', level: 'TM', title: 'CE TM', subtitle: 'Other Operations', source: 'page1' },
        
        // Separated processes
        { id: 'nosew-gl', department: 'Line', level: 'GL', title: 'No-sew GL', processType: 'No-sew', source: 'page1' },
        { id: 'nosew-tm', department: 'Line', level: 'TM', title: 'No-sew TM', processType: 'No-sew', source: 'page1' },
        { id: 'hf-welding-tl', department: 'Line', level: 'TL', title: 'HF Welding TL', processType: 'HF Welding', source: 'page1' },
        { id: 'hf-welding-tm', department: 'Line', level: 'TM', title: 'HF Welding TM', processType: 'HF Welding', source: 'page1' }
      ];

      validationEngine.registerPositions('page1', page1Positions);
      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(17);
      
      // Verify classification counts
      expect(report.summary.classificationCounts.OH).toBe(2); // PM, LM
      expect(report.summary.classificationCounts.direct).toBe(1); // CE TM Mixing
      expect(report.summary.classificationCounts.indirect).toBe(14); // All others
    });

    test('should validate realistic Page2 data with plant departments', () => {
      const page2Positions: CrossPagePosition[] = [
        // Administrative departments
        { id: 'admin-tm', department: 'Admin', level: 'TM', title: 'Admin TM', source: 'page2' },
        { id: 'small-tooling-tm', department: 'Small Tooling', level: 'TM', title: 'Small Tooling TM', source: 'page2' },
        
        // Material departments
        { id: 'raw-material-tm', department: 'Raw Material', level: 'TM', title: 'Raw Material TM', source: 'page2' },
        { id: 'sub-material-tm', department: 'Sub Material', level: 'TM', title: 'Sub Material TM', source: 'page2' },
        
        // Market departments
        { id: 'acc-market-tm', department: 'ACC Market', level: 'TM', title: 'ACC Market TM', source: 'page2' },
        { id: 'pl-market-tm', department: 'P&L Market', level: 'TM', title: 'P&L Market TM', source: 'page2' },
        { id: 'bottom-market-tm', department: 'Bottom Market', level: 'TM', title: 'Bottom Market TM', source: 'page2' },
        
        // Warehouse
        { id: 'fg-wh-tm', department: 'FG WH', level: 'TM', title: 'FG WH TM', source: 'page2' },
        { id: 'fg-wh-tm-shipping', department: 'FG WH', level: 'TM', title: 'FG WH TM', subtitle: 'Shipping', source: 'page2' },
        
        // Plant Production
        { id: 'plant-prod-tm', department: 'Plant Production', level: 'TM', title: 'Plant Production TM', source: 'page2' }
      ];

      validationEngine.registerPositions('page2', page2Positions);
      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(10);
      
      // Verify specific classifications
      expect(report.summary.classificationCounts.direct).toBe(1); // Plant Production TM
      expect(report.summary.classificationCounts.OH).toBe(3); // Admin, Small Tooling, Sub Material, FG WH Shipping
      expect(report.summary.classificationCounts.indirect).toBe(6); // Raw Material, Markets, FG WH regular
    });

    test('should validate realistic Page3 data with support departments', () => {
      const page3Positions: CrossPagePosition[] = [
        { id: 'tpm-tm', department: 'TPM', level: 'TM', title: 'TPM TM', source: 'page3' },
        { id: 'cqm-tm', department: 'CQM', level: 'TM', title: 'CQM TM', source: 'page3' },
        { id: 'lean-tm', department: 'Lean', level: 'TM', title: 'Lean TM', source: 'page3' },
        { id: 'security-tm', department: 'Security', level: 'TM', title: 'Security TM', source: 'page3' },
        { id: 'rmcc-tm', department: 'RMCC', level: 'TM', title: 'RMCC TM', source: 'page3' }
      ];

      validationEngine.registerPositions('page3', page3Positions);
      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(5);
      
      // All support departments should be OH
      expect(report.summary.classificationCounts.OH).toBe(5);
      expect(report.summary.classificationCounts.direct).toBe(0);
      expect(report.summary.classificationCounts.indirect).toBe(0);
    });

    test('should validate separated processes data', () => {
      const separatedPositions: CrossPagePosition[] = [
        { id: 'nosew-dept-gl', department: 'No-sew', level: 'GL', title: 'No-sew GL', source: 'separated' },
        { id: 'nosew-dept-tl', department: 'No-sew', level: 'TL', title: 'No-sew TL', source: 'separated' },
        { id: 'nosew-dept-tm', department: 'No-sew', level: 'TM', title: 'No-sew TM', source: 'separated' },
        { id: 'hf-welding-dept-tl', department: 'HF Welding', level: 'TL', title: 'HF Welding TL', source: 'separated' },
        { id: 'hf-welding-dept-tm', department: 'HF Welding', level: 'TM', title: 'HF Welding TM', source: 'separated' },
        { id: 'separated-blank', department: 'Separated', level: 'TM', title: 'Blank Position', source: 'separated' }
      ];

      validationEngine.registerPositions('separated', separatedPositions);
      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(6);
      
      // All separated processes should be indirect
      expect(report.summary.classificationCounts.indirect).toBe(6);
      expect(report.summary.classificationCounts.direct).toBe(0);
      expect(report.summary.classificationCounts.OH).toBe(0);
    });
  });

  describe('Cross-Page Consistency Validation', () => {
    test('should detect consistent positions across multiple pages', () => {
      const page1Positions: CrossPagePosition[] = [
        { id: 'line-pm-p1', department: 'Line', level: 'PM', title: 'Line PM', source: 'page1' },
        { id: 'ce-mixing-p1', department: 'CE', level: 'TM', title: 'CE TM', subtitle: 'Mixing', source: 'page1' }
      ];

      const page2Positions: CrossPagePosition[] = [
        { id: 'plant-prod-p2', department: 'Plant Production', level: 'TM', title: 'Plant Production TM', source: 'page2' }
      ];

      // Simulate same positions appearing in aggregation pages
      const page4DirectPositions: CrossPagePosition[] = [
        { id: 'ce-mixing-p4d', department: 'CE', level: 'TM', title: 'CE TM', subtitle: 'Mixing', source: 'page4-direct' },
        { id: 'plant-prod-p4d', department: 'Plant Production', level: 'TM', title: 'Plant Production TM', source: 'page4-direct' }
      ];

      const page4IndirectPositions: CrossPagePosition[] = [
        { id: 'line-pm-p4i', department: 'Line', level: 'PM', title: 'Line PM', source: 'page4-indirect' }
      ];

      validationEngine.registerPositions('page1', page1Positions);
      validationEngine.registerPositions('page2', page2Positions);
      validationEngine.registerPositions('page4-direct', page4DirectPositions);
      validationEngine.registerPositions('page4-indirect', page4IndirectPositions);

      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(true);
      expect(report.summary.pagesCovered).toHaveLength(4);
      expect(report.summary.totalPositions).toBe(6);
    });

    test('should detect inconsistent classifications across pages', () => {
      const page1Positions: CrossPagePosition[] = [
        { 
          id: 'line-pm-p1', 
          department: 'Line', 
          level: 'PM', 
          title: 'Line PM', 
          source: 'page1',
          classification: 'OH' // Correct
        }
      ];

      const page4Positions: CrossPagePosition[] = [
        { 
          id: 'line-pm-p4', 
          department: 'Line', 
          level: 'PM', 
          title: 'Line PM', 
          source: 'page4-direct',
          classification: 'direct' // Incorrect - should be OH
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
      expect(inconsistency.pages).toContain('page1');
      expect(inconsistency.pages).toContain('page4-direct');
    });

    test('should handle department name variations consistently', () => {
      const page1Positions: CrossPagePosition[] = [
        { id: 'raw-mat-1', department: 'Raw Material', level: 'TM', title: 'Raw Material TM', source: 'page1' }
      ];

      const page2Positions: CrossPagePosition[] = [
        { id: 'raw-mat-2', department: 'RawMaterial', level: 'TM', title: 'Raw Material TM', source: 'page2' }
      ];

      validationEngine.registerPositions('page1', page1Positions);
      validationEngine.registerPositions('page2', page2Positions);

      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(true);
      // Should treat both as the same position due to normalization
    });
  });

  describe('Aggregation Validation with Real Data', () => {
    test('should validate complete application aggregation logic', () => {
      // Detailed positions from all pages
      const detailedPositions: CrossPagePosition[] = [
        // Direct positions
        { id: 'ce-mixing', department: 'CE', level: 'TM', subtitle: 'Mixing', source: 'page1' },
        { id: 'plant-prod', department: 'Plant Production', level: 'TM', source: 'page2' },
        
        // Indirect positions
        { id: 'line-gl', department: 'Line', level: 'GL', source: 'page1' },
        { id: 'quality-tm', department: 'Quality', level: 'TM', source: 'page1' },
        { id: 'raw-material', department: 'Raw Material', level: 'TM', source: 'page2' },
        { id: 'acc-market', department: 'ACC Market', level: 'TM', source: 'page2' },
        { id: 'fg-wh', department: 'FG WH', level: 'TM', source: 'page2' },
        { id: 'nosew-tm', department: 'No-sew', level: 'TM', source: 'separated' },
        
        // OH positions
        { id: 'line-pm', department: 'Line', level: 'PM', source: 'page1' },
        { id: 'line-lm', department: 'Line', level: 'LM', source: 'page1' },
        { id: 'quality-gl', department: 'Quality', level: 'GL', source: 'page1' },
        { id: 'admin-tm', department: 'Admin', level: 'TM', source: 'page2' },
        { id: 'ce-other', department: 'CE', level: 'TM', subtitle: 'Other', source: 'page1' },
        { id: 'fg-wh-shipping', department: 'FG WH', level: 'TM', subtitle: 'Shipping', source: 'page2' },
        { id: 'tpm-tm', department: 'TPM', level: 'TM', source: 'page3' }
      ];

      // Create aggregation pages based on expected classifications
      const directPagePositions = detailedPositions.filter(p => 
        classifyPosition(p.department, p.level, p.processType, p.subtitle) === 'direct'
      );

      const indirectAndOHPositions = detailedPositions.filter(p => {
        const classification = classifyPosition(p.department, p.level, p.processType, p.subtitle);
        return classification === 'indirect' || classification === 'OH';
      });

      const aggregationResult = validationEngine.validateAggregation(
        directPagePositions,
        indirectAndOHPositions,
        detailedPositions
      );

      expect(aggregationResult.isValid).toBe(true);
      expect(aggregationResult.directPageTotal).toBe(2); // CE Mixing, Plant Production
      expect(aggregationResult.indirectPageTotal).toBe(13); // All others
      expect(aggregationResult.detailedViewTotal).toBe(15);
      expect(aggregationResult.directPageTotal + aggregationResult.indirectPageTotal)
        .toBe(aggregationResult.detailedViewTotal);
    });

    test('should detect CE TM aggregation issues', () => {
      const detailedPositions: CrossPagePosition[] = [
        { id: 'ce-mixing', department: 'CE', level: 'TM', subtitle: 'Mixing', source: 'page1' },
        { id: 'ce-other', department: 'CE', level: 'TM', subtitle: 'Other', source: 'page1' }
      ];

      // Incorrect aggregation - CE Mixing should be in direct, CE Other should be in indirect
      const directPagePositions: CrossPagePosition[] = [
        { id: 'ce-other-wrong', department: 'CE', level: 'TM', subtitle: 'Other', source: 'page4-direct' } // Wrong!
      ];

      const indirectPagePositions: CrossPagePosition[] = [
        { id: 'ce-mixing-wrong', department: 'CE', level: 'TM', subtitle: 'Mixing', source: 'page4-indirect' } // Wrong!
      ];

      const result = validationEngine.validateAggregation(
        directPagePositions,
        indirectPagePositions,
        detailedPositions
      );

      expect(result.isValid).toBe(false);
      expect(result.mismatches.length).toBeGreaterThan(0);
      
      // Should detect that CE Mixing is in wrong page
      const mixingMismatch = result.mismatches.find(m => 
        m.department === 'CE' && m.reason.includes('Mixing')
      );
      expect(mixingMismatch).toBeDefined();
    });

    test('should validate separated processes aggregation correctly', () => {
      const detailedPositions: CrossPagePosition[] = [
        { id: 'nosew-gl', department: 'No-sew', level: 'GL', source: 'separated' },
        { id: 'hf-welding-tm', department: 'HF Welding', level: 'TM', source: 'separated' },
        { id: 'plant-prod', department: 'Plant Production', level: 'TM', source: 'page1' }
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
      expect(result.directPageTotal).toBe(1); // Only Plant Production
      expect(result.indirectPageTotal).toBe(2); // No-sew and HF Welding
    });
  });

  describe('Performance and Scalability Tests', () => {
    test('should handle large datasets efficiently', () => {
      const largeDataset: CrossPagePosition[] = [];
      const departments = ['Line', 'Quality', 'CE', 'Admin', 'Raw Material'];
      const levels: Array<'PM' | 'LM' | 'GL' | 'TL' | 'TM'> = ['PM', 'LM', 'GL', 'TL', 'TM'];
      
      // Generate 500 positions
      for (let i = 0; i < 500; i++) {
        largeDataset.push({
          id: `position-${i}`,
          department: departments[i % departments.length],
          level: levels[i % levels.length],
          title: `Position ${i}`,
          source: `page${(i % 3) + 1}`
        });
      }

      const startTime = Date.now();
      validationEngine.registerPositions('large-test', largeDataset);
      const report = validationEngine.validateConsistency();
      const endTime = Date.now();

      expect(report).toBeDefined();
      expect(report.summary.totalPositions).toBe(500);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should generate detailed reports efficiently', () => {
      const positions: CrossPagePosition[] = [
        { id: 'line-pm', department: 'Line', level: 'PM', source: 'page1' },
        { id: 'line-gl', department: 'Line', level: 'GL', source: 'page1' },
        { id: 'quality-tm', department: 'Quality', level: 'TM', source: 'page2' },
        { id: 'admin-tm', department: 'Admin', level: 'TM', source: 'page3' }
      ];

      validationEngine.registerPositions('test', positions);
      
      const startTime = Date.now();
      const detailedReport = validationEngine.generateDetailedReport();
      const endTime = Date.now();

      expect(detailedReport.departmentAnalysis).toBeDefined();
      expect(detailedReport.levelAnalysis).toBeDefined();
      expect(detailedReport.departmentAnalysis['Line']).toBeDefined();
      expect(detailedReport.levelAnalysis['PM']).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty datasets gracefully', () => {
      const report = validationEngine.validateConsistency();
      
      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(0);
      expect(report.inconsistencies).toHaveLength(0);
    });

    test('should handle malformed position data', () => {
      const malformedPositions: CrossPagePosition[] = [
        { id: '', department: '', level: 'TM', source: 'test' },
        { id: 'test', department: 'Unknown Department', level: 'TM', source: 'test' }
      ];

      expect(() => {
        validationEngine.registerPositions('malformed', malformedPositions);
        validationEngine.validateConsistency();
      }).not.toThrow();
    });

    test('should handle positions with missing optional fields', () => {
      const positions: CrossPagePosition[] = [
        { id: 'minimal', department: 'Line', level: 'TM', source: 'test' }, // No title, subtitle
        { id: 'partial', department: 'Quality', level: 'GL', title: 'Quality GL', source: 'test' } // No subtitle
      ];

      validationEngine.registerPositions('minimal', positions);
      const report = validationEngine.validateConsistency();

      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(2);
    });

    test('should validate individual positions with detailed error reporting', () => {
      const validPosition: CrossPagePosition = {
        id: 'valid',
        department: 'Line',
        level: 'PM',
        title: 'Line PM',
        source: 'test'
      };

      const invalidPosition: CrossPagePosition = {
        id: 'invalid',
        department: '',
        level: 'TM',
        source: 'test'
      };

      const validResult = validationEngine.validatePosition(validPosition);
      const invalidResult = validationEngine.validatePosition(invalidPosition);

      expect(validResult.isValid).toBe(true);
      expect(validResult.expectedClassification).toBe('OH');

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.issues).toContain('Department is required');
    });
  });
});