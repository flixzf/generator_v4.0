/**
 * Data Consistency Validation Utility Tests
 * 
 * This test suite validates the DataConsistencyValidator utility that implements
 * task 10 from the data-consistency-fixes spec:
 * - Write utility function that can be run to validate entire application data consistency
 * - Implement automated testing that runs validation checks on different configuration scenarios
 * - Create validation summary report showing classification distribution and any issues
 * 
 * Requirements: 2.4, 2.5, 3.1, 3.2, 3.3
 */

import {
  DataConsistencyValidator,
  ValidationScenario,
  DataConsistencyReport,
  CriticalIssue,
  validateApplicationConsistency,
  runAutomatedValidationTests,
  quickValidationCheck
} from '@/components/common/DataConsistencyValidator';

import {
  CrossPagePosition,
  ValidationEngine
} from '@/components/common/ValidationEngine';

import {
  ClassificationEngine,
  classifyPosition
} from '@/components/common/ClassificationEngine';
import test from 'node:test';
import test from 'node:test';
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
import test from 'node:test';
import test from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

describe('Data Consistency Validation Utility', () => {
  let validator: DataConsistencyValidator;
  let mockValidationEngine: ValidationEngine;
  let mockClassificationEngine: ClassificationEngine;

  beforeEach(() => {
    mockClassificationEngine = new ClassificationEngine();
    mockValidationEngine = new ValidationEngine(mockClassificationEngine);
    validator = new DataConsistencyValidator(mockValidationEngine, mockClassificationEngine);
  });

  describe('Application Data Consistency Validation', () => {
    test('should validate complete application data consistency', async () => {
      const pageData = {
        page1: [
          { id: 'line-pm', department: 'Line', level: 'PM' as const, title: 'Line PM', source: 'page1' },
          { id: 'line-gl', department: 'Line', level: 'GL' as const, title: 'Line GL', source: 'page1' },
          { id: 'ce-mixing', department: 'CE', level: 'TM' as const, title: 'CE TM', subtitle: 'Mixing', source: 'page1' }
        ],
        page2: [
          { id: 'admin-tm', department: 'Admin', level: 'TM' as const, title: 'Admin TM', source: 'page2' },
          { id: 'plant-prod', department: 'Plant Production', level: 'TM' as const, title: 'Plant Production TM', source: 'page2' }
        ],
        page3: [
          { id: 'tpm-tm', department: 'TPM', level: 'TM' as const, title: 'TPM TM', source: 'page3' }
        ],
        separated: [
          { id: 'nosew-gl', department: 'No-sew', level: 'GL' as const, title: 'No-sew GL', source: 'separated' }
        ]
      };

      const report = await validator.validateApplicationConsistency(pageData);

      expect(report).toBeDefined();
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.consistencyValidation).toBeDefined();
      expect(report.classificationDistribution).toBeDefined();
      expect(report.departmentAnalysis).toBeDefined();
      expect(report.levelAnalysis).toBeDefined();
      expect(report.criticalIssues).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.overallHealth).toMatch(/^(healthy|warning|critical)$/);
      expect(report.summary).toBeDefined();

      // Verify classification distribution
      expect(report.classificationDistribution.direct.count).toBeGreaterThan(0); // CE Mixing, Plant Production
      expect(report.classificationDistribution.indirect.count).toBeGreaterThan(0); // Line GL, No-sew
      expect(report.classificationDistribution.OH.count).toBeGreaterThan(0); // Line PM, Admin, TPM

      // Verify percentages add up to 100
      const totalPercentage = 
        report.classificationDistribution.direct.percentage +
        report.classificationDistribution.indirect.percentage +
        report.classificationDistribution.OH.percentage;
      expect(Math.round(totalPercentage)).toBe(100);

      // Verify department analysis
      expect(report.departmentAnalysis['Line']).toBeDefined();
      expect(report.departmentAnalysis['Line'].totalPositions).toBe(2);
      expect(report.departmentAnalysis['CE']).toBeDefined();
      expect(report.departmentAnalysis['Admin']).toBeDefined();

      // Verify level analysis
      expect(report.levelAnalysis['PM']).toBeDefined();
      expect(report.levelAnalysis['GL']).toBeDefined();
      expect(report.levelAnalysis['TM']).toBeDefined();
    });

    test('should validate with aggregation data', async () => {
      const detailedPositions = [
        { id: 'ce-mixing', department: 'CE', level: 'TM' as const, subtitle: 'Mixing', source: 'page1' },
        { id: 'plant-prod', department: 'Plant Production', level: 'TM' as const, source: 'page2' },
        { id: 'line-gl', department: 'Line', level: 'GL' as const, source: 'page1' },
        { id: 'admin-tm', department: 'Admin', level: 'TM' as const, source: 'page2' }
      ];

      const directPositions = detailedPositions.filter(p => 
        classifyPosition(p.department, p.level, p.processType, p.subtitle) === 'direct'
      );

      const indirectPositions = detailedPositions.filter(p => {
        const classification = classifyPosition(p.department, p.level, p.processType, p.subtitle);
        return classification === 'indirect' || classification === 'OH';
      });

      const pageData = {
        page1: [detailedPositions[0], detailedPositions[2]],
        page2: [detailedPositions[1], detailedPositions[3]],
        page4Direct: directPositions,
        page4Indirect: indirectPositions
      };

      const report = await validator.validateApplicationConsistency(pageData);

      expect(report.aggregationValidation).toBeDefined();
      expect(report.aggregationValidation!.isValid).toBe(true);
      expect(report.aggregationValidation!.directPageTotal).toBe(2); // CE Mixing, Plant Production
      expect(report.aggregationValidation!.indirectPageTotal).toBe(2); // Line GL, Admin
    });

    test('should detect critical issues', async () => {
      const pageData = {
        page1: [
          { 
            id: 'line-pm-1', 
            department: 'Line', 
            level: 'PM' as const, 
            title: 'Line PM', 
            source: 'page1',
            classification: 'OH' as const // Correct
          }
        ],
        page2: [
          { 
            id: 'line-pm-2', 
            department: 'Line', 
            level: 'PM' as const, 
            title: 'Line PM', 
            source: 'page2',
            classification: 'direct' as const // Incorrect - should be OH
          }
        ]
      };

      const report = await validator.validateApplicationConsistency(pageData);

      expect(report.overallHealth).toBe('critical');
      expect(report.criticalIssues.length).toBeGreaterThan(0);
      
      const classificationIssue = report.criticalIssues.find(
        issue => issue.type === 'classification_inconsistency'
      );
      expect(classificationIssue).toBeDefined();
      expect(classificationIssue!.affectedPositions.length).toBeGreaterThan(0);
    });

    test('should handle empty data gracefully', async () => {
      const report = await validator.validateApplicationConsistency({});

      expect(report.overallHealth).toBe('healthy');
      expect(report.summary.totalPositions).toBe(0);
      expect(report.classificationDistribution.direct.count).toBe(0);
      expect(report.classificationDistribution.indirect.count).toBe(0);
      expect(report.classificationDistribution.OH.count).toBe(0);
    });

    test('should generate appropriate recommendations', async () => {
      const pageData = {
        page1: [
          { id: 'line-pm', department: 'Line', level: 'PM' as const, source: 'page1' },
          { id: 'ce-mixing', department: 'CE', level: 'TM' as const, subtitle: 'Mixing', source: 'page1' }
        ]
      };

      const report = await validator.validateApplicationConsistency(pageData);

      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Automated Validation Testing', () => {
    test('should run automated tests with default scenarios', async () => {
      const result = await validator.runAutomatedValidationTests();

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);

      // Verify summary structure
      expect(result.summary.totalScenarios).toBe(result.results.length);
      expect(result.summary.passedScenarios).toBeGreaterThanOrEqual(0);
      expect(result.summary.failedScenarios).toBeGreaterThanOrEqual(0);
      expect(result.summary.passedScenarios + result.summary.failedScenarios).toBe(result.summary.totalScenarios);
      expect(result.summary.overallStatus).toMatch(/^(pass|warning|fail)$/);

      // Verify each result has required structure
      result.results.forEach(report => {
        expect(report.scenario).toBeDefined();
        expect(report.consistencyValidation).toBeDefined();
        expect(report.classificationDistribution).toBeDefined();
        expect(report.overallHealth).toMatch(/^(healthy|warning|critical)$/);
      });
    });

    test('should run automated tests with custom scenarios', async () => {
      const customScenarios: ValidationScenario[] = [
        {
          name: 'test_scenario_1',
          description: 'Custom test scenario',
          lineCount: 2,
          modelSelection: ['Model A'],
          expectedDirectCount: 4,
          expectedIndirectCount: 10,
          expectedOHCount: 8
        },
        {
          name: 'test_scenario_2',
          description: 'Another custom test scenario',
          lineCount: 1,
          modelSelection: ['Model B'],
          expectedDirectCount: 2,
          expectedIndirectCount: 6,
          expectedOHCount: 4
        }
      ];

      const result = await validator.runAutomatedValidationTests(customScenarios);

      expect(result.results).toHaveLength(2);
      expect(result.summary.totalScenarios).toBe(2);
      
      // Verify scenarios were used
      expect(result.results[0].scenario?.name).toBe('test_scenario_1');
      expect(result.results[1].scenario?.name).toBe('test_scenario_2');
    });

    test('should handle scenario execution errors gracefully', async () => {
      // Create a scenario that might cause issues
      const problematicScenarios: ValidationScenario[] = [
        {
          name: 'edge_case_scenario',
          description: 'Scenario with edge case data',
          lineCount: 0,
          modelSelection: [],
          expectedDirectCount: 0,
          expectedIndirectCount: 0,
          expectedOHCount: 0
        }
      ];

      const result = await validator.runAutomatedValidationTests(problematicScenarios);

      expect(result).toBeDefined();
      expect(result.results).toHaveLength(1);
      expect(result.summary.totalScenarios).toBe(1);
      
      // Should handle gracefully without throwing
      const report = result.results[0];
      expect(report.scenario?.name).toBe('edge_case_scenario');
    });
  });

  describe('Validation Summary Reports', () => {
    test('should generate comprehensive validation summary', async () => {
      // Generate multiple reports
      const reports: DataConsistencyReport[] = [];
      
      const scenarios = [
        { lineCount: 1, modelSelection: ['Model A'] },
        { lineCount: 2, modelSelection: ['Model A', 'Model B'] },
        { lineCount: 3, modelSelection: ['Model A', 'Model B', 'Model C'] }
      ];

      for (const scenario of scenarios) {
        const pageData = {
          page1: [
            { id: 'line-pm', department: 'Line', level: 'PM' as const, source: 'page1' },
            { id: 'ce-mixing', department: 'CE', level: 'TM' as const, subtitle: 'Mixing', source: 'page1' }
          ]
        };

        const report = await validator.validateApplicationConsistency(pageData, {
          name: `scenario_${scenario.lineCount}`,
          description: `Test scenario with ${scenario.lineCount} lines`,
          ...scenario
        });
        reports.push(report);
      }

      const summary = validator.generateValidationSummaryReport(reports);

      expect(summary).toBeDefined();
      expect(summary.executionSummary).toBeDefined();
      expect(summary.classificationTrends).toBeDefined();
      expect(summary.commonIssues).toBeDefined();
      expect(summary.recommendations).toBeDefined();
      expect(summary.detailedFindings).toBeDefined();

      // Verify execution summary
      expect(summary.executionSummary.totalReports).toBe(3);
      expect(summary.executionSummary.healthyReports).toBeGreaterThanOrEqual(0);
      expect(summary.executionSummary.warningReports).toBeGreaterThanOrEqual(0);
      expect(summary.executionSummary.criticalReports).toBeGreaterThanOrEqual(0);

      // Verify classification trends
      expect(summary.classificationTrends.averageDirectPercentage).toBeGreaterThanOrEqual(0);
      expect(summary.classificationTrends.averageIndirectPercentage).toBeGreaterThanOrEqual(0);
      expect(summary.classificationTrends.averageOHPercentage).toBeGreaterThanOrEqual(0);
      expect(summary.classificationTrends.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(summary.classificationTrends.consistencyScore).toBeLessThanOrEqual(1);

      // Verify arrays are defined
      expect(Array.isArray(summary.commonIssues)).toBe(true);
      expect(Array.isArray(summary.recommendations)).toBe(true);
      expect(Array.isArray(summary.detailedFindings)).toBe(true);
    });

    test('should identify common issues across reports', async () => {
      // Create reports with similar issues
      const reportsWithIssues: DataConsistencyReport[] = [];
      
      for (let i = 0; i < 3; i++) {
        const pageData = {
          page1: [
            { 
              id: `line-pm-1-${i}`, 
              department: 'Line', 
              level: 'PM' as const, 
              source: 'page1',
              classification: 'OH' as const // Correct
            }
          ],
          page2: [
            { 
              id: `line-pm-2-${i}`, 
              department: 'Line', 
              level: 'PM' as const, 
              source: 'page2',
              classification: 'direct' as const // Incorrect - should be OH
            }
          ]
        };

        const report = await validator.validateApplicationConsistency(pageData);
        reportsWithIssues.push(report);
      }

      const summary = validator.generateValidationSummaryReport(reportsWithIssues);

      expect(summary.commonIssues.length).toBeGreaterThan(0);
      
      // Should identify the common classification issue
      const commonIssue = summary.commonIssues.find(issue => 
        issue.issue.includes('classification') || issue.issue.includes('inconsistency') || issue.issue.includes('different')
      );
      expect(commonIssue).toBeDefined();
      if (commonIssue) {
        expect(commonIssue.frequency).toBeGreaterThan(1);
        expect(commonIssue.affectedReports).toBeGreaterThan(1);
      }
    });
  });

  describe('Quick Validation Check', () => {
    test('should perform quick validation check', async () => {
      const pageData = {
        page1: [
          { id: 'line-pm', department: 'Line', level: 'PM' as const, source: 'page1' },
          { id: 'ce-mixing', department: 'CE', level: 'TM' as const, subtitle: 'Mixing', source: 'page1' }
        ],
        page2: [
          { id: 'admin-tm', department: 'Admin', level: 'TM' as const, source: 'page2' }
        ]
      };

      const result = await validator.quickValidationCheck(pageData);

      expect(result).toBeDefined();
      expect(typeof result.isHealthy).toBe('boolean');
      expect(typeof result.criticalIssueCount).toBe('number');
      expect(typeof result.warningCount).toBe('number');
      expect(typeof result.quickSummary).toBe('string');
      expect(Array.isArray(result.recommendations)).toBe(true);

      expect(result.criticalIssueCount).toBeGreaterThanOrEqual(0);
      expect(result.warningCount).toBeGreaterThanOrEqual(0);
      expect(result.quickSummary.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeLessThanOrEqual(3); // Should limit to top 3
    });

    test('should handle quick validation errors gracefully', async () => {
      // Test with potentially problematic data
      const result = await validator.quickValidationCheck({});

      expect(result).toBeDefined();
      expect(typeof result.isHealthy).toBe('boolean');
      expect(typeof result.criticalIssueCount).toBe('number');
      expect(typeof result.warningCount).toBe('number');
      expect(typeof result.quickSummary).toBe('string');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    test('validateApplicationConsistency utility function should work', async () => {
      const pageData = {
        page1: [
          { id: 'line-pm', department: 'Line', level: 'PM' as const, source: 'page1' }
        ]
      };

      const report = await validateApplicationConsistency(pageData);

      expect(report).toBeDefined();
      expect(report.consistencyValidation).toBeDefined();
      expect(report.classificationDistribution).toBeDefined();
      expect(report.overallHealth).toMatch(/^(healthy|warning|critical)$/);
    });

    test('runAutomatedValidationTests utility function should work', async () => {
      const result = await runAutomatedValidationTests();

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
    });

    test('quickValidationCheck utility function should work', async () => {
      const pageData = {
        page1: [
          { id: 'line-pm', department: 'Line', level: 'PM' as const, source: 'page1' }
        ]
      };

      const result = await quickValidationCheck(pageData);

      expect(result).toBeDefined();
      expect(typeof result.isHealthy).toBe('boolean');
      expect(typeof result.criticalIssueCount).toBe('number');
      expect(typeof result.quickSummary).toBe('string');
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large datasets efficiently', async () => {
      const largePageData = {
        page1: [] as CrossPagePosition[],
        page2: [] as CrossPagePosition[],
        page3: [] as CrossPagePosition[]
      };

      // Generate large dataset
      const departments = ['Line', 'Quality', 'CE', 'Admin', 'Raw Material'];
      const levels: Array<'PM' | 'LM' | 'GL' | 'TL' | 'TM'> = ['PM', 'LM', 'GL', 'TL', 'TM'];

      for (let i = 0; i < 300; i++) {
        const position: CrossPagePosition = {
          id: `position-${i}`,
          department: departments[i % departments.length],
          level: levels[i % levels.length],
          title: `Position ${i}`,
          source: `page${(i % 3) + 1}`
        };

        if (i % 3 === 0) largePageData.page1.push(position);
        else if (i % 3 === 1) largePageData.page2.push(position);
        else largePageData.page3.push(position);
      }

      const startTime = Date.now();
      const report = await validator.validateApplicationConsistency(largePageData);
      const endTime = Date.now();

      expect(report).toBeDefined();
      expect(report.summary.totalPositions).toBe(300);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle malformed data gracefully', async () => {
      const malformedData = {
        page1: [
          { id: '', department: '', level: 'TM' as const, source: 'page1' },
          { id: 'test', department: 'Unknown Dept', level: 'TM' as const, source: 'page1' }
        ]
      };

      const report = await validator.validateApplicationConsistency(malformedData);

      expect(report).toBeDefined();
      expect(report.overallHealth).toMatch(/^(healthy|warning|critical)$/);
      // Should handle gracefully without throwing errors
    });

    test('should validate specific requirements from the spec', async () => {
      // Requirement 2.4: Sum of Direct + Indirect + OH should equal total
      const pageData = {
        page1: [
          { id: 'ce-mixing', department: 'CE', level: 'TM' as const, subtitle: 'Mixing', source: 'page1' }, // direct
          { id: 'plant-prod', department: 'Plant Production', level: 'TM' as const, source: 'page1' }, // direct
          { id: 'line-gl', department: 'Line', level: 'GL' as const, source: 'page1' }, // indirect
          { id: 'line-pm', department: 'Line', level: 'PM' as const, source: 'page1' }, // OH
          { id: 'admin-tm', department: 'Admin', level: 'TM' as const, source: 'page1' } // OH
        ]
      };

      const report = await validator.validateApplicationConsistency(pageData);

      const totalClassified = 
        report.classificationDistribution.direct.count +
        report.classificationDistribution.indirect.count +
        report.classificationDistribution.OH.count;

      expect(totalClassified).toBe(report.summary.totalPositions);
      expect(totalClassified).toBe(5);

      // Verify specific classifications
      expect(report.classificationDistribution.direct.count).toBe(2); // CE Mixing, Plant Production
      expect(report.classificationDistribution.indirect.count).toBe(1); // Line GL
      expect(report.classificationDistribution.OH.count).toBe(2); // Line PM, Admin
    });

    test('should validate CE TM classification requirements (Requirement 2.3)', async () => {
      const pageData = {
        page1: [
          { id: 'ce-mixing', department: 'CE', level: 'TM' as const, subtitle: 'Mixing', source: 'page1' },
          { id: 'ce-other', department: 'CE', level: 'TM' as const, subtitle: 'Other', source: 'page1' }
        ]
      };

      const report = await validator.validateApplicationConsistency(pageData);

      // CE TM Mixing should be direct, CE TM Other should be OH
      expect(report.classificationDistribution.direct.count).toBe(1);
      expect(report.classificationDistribution.OH.count).toBe(1);
      
      // Verify specific positions
      expect(report.classificationDistribution.direct.positions).toContain('CE TM (Mixing)');
      expect(report.classificationDistribution.OH.positions).toContain('CE TM (Other)');
    });

    test('should validate separated processes classification (Requirement 2.2)', async () => {
      const pageData = {
        separated: [
          { id: 'nosew-gl', department: 'No-sew', level: 'GL' as const, source: 'separated' },
          { id: 'hf-welding-tm', department: 'HF Welding', level: 'TM' as const, source: 'separated' }
        ]
      };

      const report = await validator.validateApplicationConsistency(pageData);

      // Both separated processes should be indirect
      expect(report.classificationDistribution.indirect.count).toBe(2);
      expect(report.classificationDistribution.direct.count).toBe(0);
      expect(report.classificationDistribution.OH.count).toBe(0);
    });
  });
});