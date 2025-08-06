/**
 * Integration tests for ValidationEngine with realistic position data
 */

import { ValidationEngine, CrossPagePosition } from '../ValidationEngine';
import { ClassificationEngine } from '../ClassificationEngine';
import { extractPositionsFromNodes, extractPositionsFromDepartments, ReactFlowNode, DepartmentData } from '../PositionExtractor';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

describe('ValidationEngine Integration Tests', () => {
  let validationEngine: ValidationEngine;

  beforeEach(() => {
    validationEngine = new ValidationEngine(new ClassificationEngine());
    validationEngine.clearPositions();
  });

  describe('Real-world Position Validation', () => {
    it('should validate positions from Page1 (Line-based view)', () => {
      // Simulate positions from Page1 - Line-based organization view
      const page1Positions: CrossPagePosition[] = [
        // Plant Manager
        {
          id: 'pm-1',
          department: 'Line',
          level: 'PM',
          title: 'PM',
          subtitle: 'Plant Manager',
          source: 'page1',
          classification: 'OH'
        },
        // Line Manager
        {
          id: 'lm-1',
          department: 'Line',
          level: 'LM',
          title: 'LM',
          subtitle: 'Line Manager',
          source: 'page1',
          classification: 'OH'
        },
        // Main process positions
        {
          id: 'gl-cutting',
          department: 'Line',
          level: 'GL',
          title: 'GL',
          subtitle: 'Cutting-Prefit',
          source: 'page1',
          classification: 'indirect'
        },
        {
          id: 'tl-cutting',
          department: 'Line',
          level: 'TL',
          title: 'TL',
          subtitle: 'Cutting-Prefit',
          source: 'page1',
          classification: 'indirect'
        },
        {
          id: 'tm-cutting',
          department: 'Line',
          level: 'TM',
          title: 'TM',
          subtitle: 'Cutting-Prefit TM',
          source: 'page1',
          classification: 'indirect'
        },
        // Separated process positions
        {
          id: 'gl-nosew',
          department: 'No-sew',
          level: 'GL',
          processType: 'No-sew',
          source: 'page1',
          classification: 'direct'
        },
        {
          id: 'tl-nosew',
          department: 'No-sew',
          level: 'TL',
          processType: 'No-sew',
          source: 'page1',
          classification: 'direct'
        },
        {
          id: 'tm-nosew',
          department: 'No-sew',
          level: 'TM',
          processType: 'No-sew',
          source: 'page1',
          classification: 'direct'
        }
      ];

      validationEngine.registerPositions('page1', page1Positions);

      const report = validationEngine.validateConsistency();
      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(8);
      expect(report.summary.classificationCounts.OH).toBe(2); // PM, LM
      expect(report.summary.classificationCounts.indirect).toBe(3); // Line GL, TL, TM
      expect(report.summary.classificationCounts.direct).toBe(3); // No-sew positions
    });

    it('should validate positions from Page2 (Department view)', () => {
      // Simulate positions from Page2 - Department-based view
      const page2Positions: CrossPagePosition[] = [
        // Quality department
        {
          id: 'quality-gl',
          department: 'Quality',
          level: 'GL',
          source: 'page2',
          classification: 'OH'
        },
        {
          id: 'quality-tl-1',
          department: 'Quality',
          level: 'TL',
          subtitle: 'Incoming QC',
          source: 'page2',
          classification: 'indirect'
        },
        {
          id: 'quality-tm-1',
          department: 'Quality',
          level: 'TM',
          subtitle: 'Line 1-2 QC',
          source: 'page2',
          classification: 'indirect'
        },
        // CE department
        {
          id: 'ce-gl',
          department: 'CE',
          level: 'GL',
          source: 'page2',
          classification: 'OH'
        },
        {
          id: 'ce-tm-mixing',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'page2',
          classification: 'direct' // Exception rule for CE TM Mixing
        },
        {
          id: 'ce-tl-other',
          department: 'CE',
          level: 'TL',
          subtitle: 'Maintenance',
          source: 'page2',
          classification: 'OH' // CE TL should be OH (default for CE department)
        }
      ];

      validationEngine.registerPositions('page2', page2Positions);

      const report = validationEngine.validateConsistency();
      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(6);
      
      // Verify the total adds up correctly
      const totalClassified = report.summary.classificationCounts.direct + 
                             report.summary.classificationCounts.indirect + 
                             report.summary.classificationCounts.OH;
      expect(totalClassified).toBe(6);
      
      // Verify actual classification distribution
      expect(report.summary.classificationCounts.direct).toBe(1); // CE TM Mixing (exception rule)
      expect(report.summary.classificationCounts.indirect).toBe(2); // Quality TL, TM
      expect(report.summary.classificationCounts.OH).toBe(3); // Quality GL, CE GL, CE TL
    });

    it('should detect inconsistencies across multiple pages', () => {
      // Same position appears with different classifications on different pages
      const page1Positions: CrossPagePosition[] = [
        {
          id: 'ce-tm-mixing-p1',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'page1',
          classification: 'direct' // Correct
        }
      ];

      const page2Positions: CrossPagePosition[] = [
        {
          id: 'ce-tm-mixing-p2',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'page2',
          classification: 'OH' // Incorrect
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
  });

  describe('Aggregation Validation', () => {
    it('should validate correct aggregation between detailed and summary pages', () => {
      // Detailed positions from Page1, Page2, Page3
      const detailedPositions: CrossPagePosition[] = [
        // Direct positions
        {
          id: 'ce-tm-mixing',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'detailed'
        },
        {
          id: 'nosew-gl',
          department: 'No-sew',
          level: 'GL',
          processType: 'No-sew',
          source: 'detailed'
        },
        {
          id: 'plant-prod-tm',
          department: 'Plant Production',
          level: 'TM',
          source: 'detailed'
        },
        // Indirect positions
        {
          id: 'quality-tl',
          department: 'Quality',
          level: 'TL',
          source: 'detailed'
        },
        {
          id: 'raw-material-tm',
          department: 'Raw Material',
          level: 'TM',
          source: 'detailed'
        },
        // OH positions
        {
          id: 'line-pm',
          department: 'Line',
          level: 'PM',
          source: 'detailed'
        },
        {
          id: 'admin-gl',
          department: 'Admin',
          level: 'GL',
          source: 'detailed'
        }
      ];

      // Direct aggregation page positions
      const directPagePositions: CrossPagePosition[] = [
        {
          id: 'agg-ce-tm-mixing',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'page4-direct'
        },
        {
          id: 'agg-plant-prod-tm',
          department: 'Plant Production',
          level: 'TM',
          source: 'page4-direct'
        }
      ];

      // Indirect aggregation page positions (includes OH)
      const indirectPagePositions: CrossPagePosition[] = [
        {
          id: 'agg-quality-tl',
          department: 'Quality',
          level: 'TL',
          source: 'page4-indirect'
        },
        {
          id: 'agg-raw-material-tm',
          department: 'Raw Material',
          level: 'TM',
          source: 'page4-indirect'
        },
        {
          id: 'agg-nosew-gl',
          department: 'No-sew',
          level: 'GL',
          processType: 'No-sew',
          source: 'page4-indirect'
        },
        {
          id: 'agg-line-pm',
          department: 'Line',
          level: 'PM',
          source: 'page4-indirect'
        },
        {
          id: 'agg-admin-gl',
          department: 'Admin',
          level: 'GL',
          source: 'page4-indirect'
        }
      ];

      const result = validationEngine.validateAggregation(
        directPagePositions,
        indirectPagePositions,
        detailedPositions
      );

      expect(result.isValid).toBe(true);
      expect(result.directPageTotal).toBe(2);
      expect(result.indirectPageTotal).toBe(5); // 3 indirect + 2 OH
      expect(result.detailedViewTotal).toBe(7);
      expect(result.mismatches).toHaveLength(0);
    });

    it('should detect when positions appear in wrong aggregation pages', () => {
      const detailedPositions: CrossPagePosition[] = [
        {
          id: 'ce-tm-mixing',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'detailed'
        }
      ];

      // Direct position incorrectly appears in indirect page
      const directPagePositions: CrossPagePosition[] = [];
      const indirectPagePositions: CrossPagePosition[] = [
        {
          id: 'wrong-ce-tm-mixing',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'page4-indirect'
        }
      ];

      const result = validationEngine.validateAggregation(
        directPagePositions,
        indirectPagePositions,
        detailedPositions
      );

      expect(result.isValid).toBe(false);
      expect(result.mismatches.length).toBeGreaterThan(0);
      
      // Should detect that CE TM Mixing is in wrong aggregation page
      const wrongPageMismatch = result.mismatches.find(m => 
        m.department === 'CE' && m.level === 'TM'
      );
      expect(wrongPageMismatch).toBeDefined();
    });
  });

  describe('Position Extractor Integration', () => {
    it('should extract and validate positions from ReactFlow nodes', () => {
      const mockNodes: ReactFlowNode[] = [
        {
          id: 'node-1',
          type: 'position',
          position: { x: 0, y: 0 },
          data: {
            title: 'PM',
            subtitle: 'Plant Manager',
            level: 0,
            colorCategory: 'OH',
            department: 'Line'
          }
        },
        {
          id: 'node-2',
          type: 'position',
          position: { x: 100, y: 100 },
          data: {
            title: 'TM',
            subtitle: 'Mixing',
            level: 4,
            colorCategory: 'direct',
            department: 'CE'
          }
        },
        {
          id: 'dept-node',
          type: 'position',
          position: { x: 50, y: 50 },
          data: {
            title: 'DEPT',
            subtitle: 'Quality',
            level: 0,
            colorCategory: 'OH',
            isDeptName: true // Should be excluded
          }
        }
      ];

      const extractedPositions = extractPositionsFromNodes(mockNodes, 'test-page');
      expect(extractedPositions).toHaveLength(2); // Dept name node excluded

      validationEngine.registerPositions('test-page', extractedPositions);
      const report = validationEngine.validateConsistency();
      
      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(2);
    });

    it('should extract and validate positions from department data', () => {
      const mockDepartments: Record<string, DepartmentData> = {
        'Quality': {
          name: 'Quality',
          title: ['Quality'],
          tl: ['Incoming QC', 'Line QC'],
          tm: [['Line 1-2'], ['Line 3-4']],
          PM: 0,
          LM: 0,
          GL: 1,
          TL: 2,
          TM: 2
        },
        'Admin': {
          name: 'Admin',
          title: ['Admin'],
          tl: [],
          tm: [['Payroll'], ['APS']],
          PM: 0,
          LM: 0,
          GL: 1,
          TL: 0,
          TM: 2
        }
      };

      const extractedPositions = extractPositionsFromDepartments(mockDepartments, 'test-page');
      expect(extractedPositions.length).toBeGreaterThan(0);

      validationEngine.registerPositions('test-page', extractedPositions);
      const report = validationEngine.validateConsistency();
      
      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(extractedPositions.length);
    });
  });

  describe('Comprehensive Validation Scenarios', () => {
    it('should handle complex multi-page validation with separated processes', () => {
      // Page1 - Main line positions
      const page1Positions: CrossPagePosition[] = [
        {
          id: 'p1-pm',
          department: 'Line',
          level: 'PM',
          source: 'page1',
          classification: 'OH'
        },
        {
          id: 'p1-nosew-gl',
          department: 'No-sew',
          level: 'GL',
          processType: 'No-sew',
          source: 'page1',
          classification: 'direct'
        }
      ];

      // Page2 - Department view
      const page2Positions: CrossPagePosition[] = [
        {
          id: 'p2-quality-gl',
          department: 'Quality',
          level: 'GL',
          source: 'page2',
          classification: 'OH'
        },
        {
          id: 'p2-fgwh-tm-shipping',
          department: 'FG WH',
          level: 'TM',
          subtitle: 'Shipping',
          source: 'page2',
          classification: 'OH' // Exception rule
        }
      ];

      // Page3 - Support departments
      const page3Positions: CrossPagePosition[] = [
        {
          id: 'p3-tpm-gl',
          department: 'TPM',
          level: 'GL',
          source: 'page3',
          classification: 'OH'
        },
        {
          id: 'p3-security-tm',
          department: 'Security',
          level: 'TM',
          source: 'page3',
          classification: 'OH'
        }
      ];

      validationEngine.registerPositions('page1', page1Positions);
      validationEngine.registerPositions('page2', page2Positions);
      validationEngine.registerPositions('page3', page3Positions);

      const report = validationEngine.validateConsistency();
      expect(report.isValid).toBe(true);
      expect(report.summary.totalPositions).toBe(6);
      expect(report.summary.pagesCovered).toHaveLength(3);
      
      // Check classification distribution
      expect(report.summary.classificationCounts.direct).toBe(1); // No-sew GL
      expect(report.summary.classificationCounts.OH).toBe(5); // All others
    });

    it('should generate detailed report with department and level analysis', () => {
      const positions: CrossPagePosition[] = [
        {
          id: 'line-pm',
          department: 'Line',
          level: 'PM',
          source: 'test'
        },
        {
          id: 'line-tl',
          department: 'Line',
          level: 'TL',
          source: 'test'
        },
        {
          id: 'quality-gl',
          department: 'Quality',
          level: 'GL',
          source: 'test'
        },
        {
          id: 'quality-tm',
          department: 'Quality',
          level: 'TM',
          source: 'test'
        }
      ];

      validationEngine.registerPositions('test', positions);
      const detailedReport = validationEngine.generateDetailedReport();

      expect(detailedReport.departmentAnalysis['Line']).toBeDefined();
      expect(detailedReport.departmentAnalysis['Line'].totalPositions).toBe(2);
      expect(detailedReport.departmentAnalysis['Quality']).toBeDefined();
      expect(detailedReport.departmentAnalysis['Quality'].totalPositions).toBe(2);

      expect(detailedReport.levelAnalysis['PM']).toBeDefined();
      expect(detailedReport.levelAnalysis['PM'].totalPositions).toBe(1);
      expect(detailedReport.levelAnalysis['GL']).toBeDefined();
      expect(detailedReport.levelAnalysis['GL'].totalPositions).toBe(1);
    });
  });
});