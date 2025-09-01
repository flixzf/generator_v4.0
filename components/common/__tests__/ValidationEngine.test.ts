/**
 * Unit tests for ValidationEngine
 */

import { ValidationEngine, CrossPagePosition, Inconsistency, AggregationValidationResult } from '../ValidationEngine';
import { ClassificationEngine } from '../ClassificationEngine';

describe('ValidationEngine', () => {
  let validationEngine: ValidationEngine;
  let mockClassificationEngine: ClassificationEngine;

  beforeEach(() => {
    mockClassificationEngine = new ClassificationEngine();
    validationEngine = new ValidationEngine(mockClassificationEngine);
    validationEngine.clearPositions();
  });

  describe('Position Registration', () => {
    it('should register positions from different pages', () => {
      const page1Positions: CrossPagePosition[] = [
        {
          id: 'pos1',
          department: 'Line',
          level: 'VSM',
          source: 'page1',
          classification: 'OH'
        }
      ];

      const page2Positions: CrossPagePosition[] = [
        {
          id: 'pos2',
          department: 'Quality',
          level: 'GL',
          source: 'page2',
          classification: 'OH'
        }
      ];

      validationEngine.registerPositions('page1', page1Positions);
      validationEngine.registerPositions('page2', page2Positions);

      const report = validationEngine.validateConsistency();
      expect(report.summary.pagesCovered).toContain('page1');
      expect(report.summary.pagesCovered).toContain('page2');
      expect(report.summary.totalPositions).toBe(2);
    });

    it('should clear all registered positions', () => {
      const positions: CrossPagePosition[] = [
        {
          id: 'pos1',
          department: 'Line',
          level: 'VSM',
          source: 'page1'
        }
      ];

      validationEngine.registerPositions('page1', positions);
      validationEngine.clearPositions();

      const report = validationEngine.validateConsistency();
      expect(report.summary.totalPositions).toBe(0);
      expect(report.summary.pagesCovered).toHaveLength(0);
    });
  });

  describe('Consistency Validation', () => {
    it('should detect no inconsistencies when positions are classified correctly', () => {
      const page1Positions: CrossPagePosition[] = [
        {
          id: 'pos1',
          department: 'Line',
          level: 'VSM',
          source: 'page1',
          classification: 'OH'
        }
      ];

      const page2Positions: CrossPagePosition[] = [
        {
          id: 'pos2',
          department: 'Line',
          level: 'VSM',
          source: 'page2',
          classification: 'OH'
        }
      ];

      validationEngine.registerPositions('page1', page1Positions);
      validationEngine.registerPositions('page2', page2Positions);

      const report = validationEngine.validateConsistency();
      expect(report.isValid).toBe(true);
      expect(report.inconsistencies).toHaveLength(0);
    });

    it('should detect inconsistencies when same position has different classifications', () => {
      const page1Positions: CrossPagePosition[] = [
        {
          id: 'pos1',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'page1',
          classification: 'direct'
        }
      ];

      const page2Positions: CrossPagePosition[] = [
        {
          id: 'pos2',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'page2',
          classification: 'OH' // Incorrect classification
        }
      ];

      validationEngine.registerPositions('page1', page1Positions);
      validationEngine.registerPositions('page2', page2Positions);

      const report = validationEngine.validateConsistency();
      expect(report.isValid).toBe(false);
      expect(report.inconsistencies).toHaveLength(1);
      
      const inconsistency = report.inconsistencies[0];
      expect(inconsistency.department).toBe('CE');
      expect(inconsistency.level).toBe('TM');
      expect(inconsistency.expectedClassification).toBe('direct');
      expect(inconsistency.actualClassification).toBe('OH');
      expect(inconsistency.pages).toContain('page1');
      expect(inconsistency.pages).toContain('page2');
    });

    it('should handle positions with missing classifications by using expected classification', () => {
      const positions: CrossPagePosition[] = [
        {
          id: 'pos1',
          department: 'Line',
          level: 'VSM',
          source: 'page1'
          // No classification provided
        }
      ];

      validationEngine.registerPositions('page1', positions);

      const report = validationEngine.validateConsistency();
      expect(report.isValid).toBe(true);
      expect(report.summary.classificationCounts.OH).toBe(1);
    });

    it('should provide detailed validation summary', () => {
      const positions: CrossPagePosition[] = [
        {
          id: 'pos1',
          department: 'Line',
          level: 'VSM',
          source: 'page1',
          classification: 'OH'
        },
        {
          id: 'pos2',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'page1',
          classification: 'direct'
        },
        {
          id: 'pos3',
          department: 'Quality',
          level: 'TL',
          source: 'page1',
          classification: 'indirect'
        }
      ];

      validationEngine.registerPositions('page1', positions);

      const report = validationEngine.validateConsistency();
      expect(report.summary.totalPositions).toBe(3);
      expect(report.summary.validPositions).toBe(3);
      expect(report.summary.classificationCounts.OH).toBe(1);
      expect(report.summary.classificationCounts.direct).toBe(1);
      expect(report.summary.classificationCounts.indirect).toBe(1);
    });
  });

  describe('Single Position Validation', () => {
    it('should validate a position with all required fields', () => {
      const position: CrossPagePosition = {
        id: 'pos1',
        department: 'Line',
        level: 'VSM',
        source: 'page1',
        classification: 'OH'
      };

      const result = validationEngine.validatePosition(position);
      expect(result.isValid).toBe(true);
      expect(result.expectedClassification).toBe('OH');
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const position: CrossPagePosition = {
        id: 'pos1',
        department: '',
        level: 'VSM',
        source: 'page1'
      };

      const result = validationEngine.validatePosition(position);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Department is required');
    });

    it('should warn about classification mismatches', () => {
      const position: CrossPagePosition = {
        id: 'pos1',
        department: 'Line',
        level: 'VSM',
        source: 'page1',
        classification: 'direct' // Should be OH
      };

      const result = validationEngine.validatePosition(position);
      expect(result.isValid).toBe(true); // Still valid, just a warning
      expect(result.warnings).toContain('Classification mismatch: expected OH, got direct');
    });

    it('should warn about unknown departments', () => {
      const position: CrossPagePosition = {
        id: 'pos1',
        department: 'Unknown Department',
        level: 'VSM',
        source: 'page1'
      };

      const result = validationEngine.validatePosition(position);
      expect(result.warnings).toContain('Unknown department: Unknown Department');
    });
  });

  describe('Aggregation Validation', () => {
    it('should validate correct aggregation totals', () => {
      const detailedPositions: CrossPagePosition[] = [
        {
          id: 'pos1',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'detailed',
          classification: 'direct'
        },
        {
          id: 'pos2',
          department: 'Quality',
          level: 'TL',
          source: 'detailed',
          classification: 'indirect'
        },
        {
          id: 'pos3',
          department: 'Line',
          level: 'VSM',
          source: 'detailed',
          classification: 'OH'
        }
      ];

      const directPagePositions: CrossPagePosition[] = [
        {
          id: 'pos1',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'direct-page',
          classification: 'direct'
        }
      ];

      const indirectPagePositions: CrossPagePosition[] = [
        {
          id: 'pos2',
          department: 'Quality',
          level: 'TL',
          source: 'indirect-page',
          classification: 'indirect'
        },
        {
          id: 'pos3',
          department: 'Line',
          level: 'VSM',
          source: 'indirect-page',
          classification: 'OH'
        }
      ];

      const result = validationEngine.validateAggregation(
        directPagePositions,
        indirectPagePositions,
        detailedPositions
      );

      expect(result.isValid).toBe(true);
      expect(result.directPageTotal).toBe(1);
      expect(result.indirectPageTotal).toBe(2);
      expect(result.detailedViewTotal).toBe(3);
      expect(result.mismatches).toHaveLength(0);
    });

    it('should detect aggregation mismatches', () => {
      const detailedPositions: CrossPagePosition[] = [
        {
          id: 'pos1',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'detailed',
          classification: 'direct'
        },
        {
          id: 'pos2',
          department: 'Quality',
          level: 'TL',
          source: 'detailed',
          classification: 'indirect'
        }
      ];

      const directPagePositions: CrossPagePosition[] = [
        // Missing the direct position
      ];

      const indirectPagePositions: CrossPagePosition[] = [
        {
          id: 'pos1',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'indirect-page',
          classification: 'direct' // Wrong page for this classification
        },
        {
          id: 'pos2',
          department: 'Quality',
          level: 'TL',
          source: 'indirect-page',
          classification: 'indirect'
        }
      ];

      const result = validationEngine.validateAggregation(
        directPagePositions,
        indirectPagePositions,
        detailedPositions
      );

      expect(result.isValid).toBe(false);
      expect(result.mismatches.length).toBeGreaterThan(0);
      
      // Should detect that direct position is in wrong aggregation page
      const wrongPageMismatch = result.mismatches.find(m => 
        m.department === 'CE' && m.level === 'TM'
      );
      expect(wrongPageMismatch).toBeDefined();
    });

    it('should detect total count mismatches', () => {
      const detailedPositions: CrossPagePosition[] = [
        {
          id: 'pos1',
          department: 'CE',
          level: 'TM',
          source: 'detailed',
          classification: 'direct'
        },
        {
          id: 'pos2',
          department: 'Quality',
          level: 'TL',
          source: 'detailed',
          classification: 'indirect'
        }
      ];

      const directPagePositions: CrossPagePosition[] = [
        {
          id: 'pos1',
          department: 'CE',
          level: 'TM',
          source: 'direct-page',
          classification: 'direct'
        }
      ];

      const indirectPagePositions: CrossPagePosition[] = [
        // Missing the indirect position
      ];

      const result = validationEngine.validateAggregation(
        directPagePositions,
        indirectPagePositions,
        detailedPositions
      );

      expect(result.isValid).toBe(false);
      expect(result.detailedViewTotal).toBe(2);
      expect(result.directPageTotal + result.indirectPageTotal).toBe(1);
      
      const totalMismatch = result.mismatches.find(m => m.department === 'ALL');
      expect(totalMismatch).toBeDefined();
    });
  });

  describe('Detailed Report Generation', () => {
    it('should generate detailed analysis by department and level', () => {
      const positions: CrossPagePosition[] = [
        {
          id: 'pos1',
          department: 'Line',
          level: 'VSM',
          source: 'page1',
          classification: 'OH'
        },
        {
          id: 'pos2',
          department: 'Line',
          level: 'TL',
          source: 'page1',
          classification: 'indirect'
        },
        {
          id: 'pos3',
          department: 'Quality',
          level: 'GL',
          source: 'page1',
          classification: 'OH'
        }
      ];

      validationEngine.registerPositions('page1', positions);

      const report = validationEngine.generateDetailedReport();
      
      expect(report.departmentAnalysis['Line']).toBeDefined();
      expect(report.departmentAnalysis['Line'].totalPositions).toBe(2);
      expect(report.departmentAnalysis['Line'].classifications.OH).toBe(1);
      expect(report.departmentAnalysis['Line'].classifications.indirect).toBe(1);

      expect(report.levelAnalysis['PM']).toBeDefined();
      expect(report.levelAnalysis['PM'].totalPositions).toBe(1);
      expect(report.levelAnalysis['PM'].classifications.OH).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty position lists', () => {
      const report = validationEngine.validateConsistency();
      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(0);
    });

    it('should handle positions with special characters in names', () => {
      const position: CrossPagePosition = {
        id: 'pos1',
        department: 'P&L Market',
        level: 'TM',
        subtitle: 'Line 1-2',
        source: 'page1'
      };

      const result = validationEngine.validatePosition(position);
      expect(result.isValid).toBe(true);
    });

    it('should handle separated process positions correctly', () => {
      const positions: CrossPagePosition[] = [
        {
          id: 'pos1',
          department: 'No-sew',
          level: 'GL',
          processType: 'No-sew',
          source: 'page1'
        },
        {
          id: 'pos2',
          department: 'HF Welding',
          level: 'TM',
          processType: 'HF Welding',
          source: 'page1'
        }
      ];

      validationEngine.registerPositions('page1', positions);

      const report = validationEngine.validateConsistency();
      expect(report.isValid).toBe(true);
      expect(report.summary.classificationCounts.direct).toBe(0);
      expect(report.summary.classificationCounts.indirect).toBe(2);
    });
  });
});