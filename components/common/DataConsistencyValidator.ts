/**
 * Data Consistency Validation Utility
 * 
 * This utility provides comprehensive validation functionality that can be run
 * to validate entire application data consistency across all pages and configurations.
 * 
 * Task 10 Implementation:
 * - Write utility function that can be run to validate entire application data consistency
 * - Implement automated testing that runs validation checks on different configuration scenarios
 * - Create validation summary report showing classification distribution and any issues
 * 
 * Requirements: 2.4, 2.5, 3.1, 3.2, 3.3
 */

import { 
  ValidationEngine, 
  CrossPagePosition, 
  ValidationReport, 
  AggregationValidationResult,
  Inconsistency,
  AggregationMismatch
} from './ValidationEngine';

import { 
  ClassificationEngine, 
  classifyPosition,
  Position
} from './ClassificationEngine';

import { validationLogger } from './ValidationLogger';

// Configuration scenarios for automated testing
export interface ValidationScenario {
  name: string;
  description: string;
  lineCount: number;
  modelSelection: string[];
  expectedDirectCount?: number;
  expectedIndirectCount?: number;
  expectedOHCount?: number;
}

// Comprehensive validation result
export interface DataConsistencyReport {
  timestamp: Date;
  scenario: ValidationScenario | null;
  consistencyValidation: ValidationReport;
  aggregationValidation: AggregationValidationResult | null;
  classificationDistribution: {
    direct: {
      count: number;
      percentage: number;
      positions: string[];
    };
    indirect: {
      count: number;
      percentage: number;
      positions: string[];
    };
    OH: {
      count: number;
      percentage: number;
      positions: string[];
    };
  };
  departmentAnalysis: Record<string, {
    totalPositions: number;
    directCount: number;
    indirectCount: number;
    ohCount: number;
    inconsistencies: number;
    issues: string[];
  }>;
  levelAnalysis: Record<string, {
    totalPositions: number;
    directCount: number;
    indirectCount: number;
    ohCount: number;
    inconsistencies: number;
    issues: string[];
  }>;
  criticalIssues: CriticalIssue[];
  recommendations: string[];
  overallHealth: 'healthy' | 'warning' | 'critical';
  summary: {
    totalPositions: number;
    validPositions: number;
    inconsistentPositions: number;
    aggregationMismatches: number;
    criticalIssueCount: number;
    warningCount: number;
  };
}

export interface CriticalIssue {
  type: 'classification_inconsistency' | 'aggregation_mismatch' | 'missing_positions' | 'duplicate_positions' | 'invalid_data';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedPositions: string[];
  recommendation: string;
  pages: string[];
}

// Mock data generator for testing different scenarios
export interface MockDataGenerator {
  generatePage1Data(lineCount: number): CrossPagePosition[];
  generatePage2Data(): CrossPagePosition[];
  generatePage3Data(): CrossPagePosition[];
  generateSeparatedData(): CrossPagePosition[];
  generateAggregationData(detailedPositions: CrossPagePosition[]): {
    directPage: CrossPagePosition[];
    indirectPage: CrossPagePosition[];
  };
}

/**
 * Data Consistency Validation Utility Class
 */
export class DataConsistencyValidator {
  private validationEngine: ValidationEngine;
  private classificationEngine: ClassificationEngine;
  private mockDataGenerator: MockDataGenerator;

  constructor(
    validationEngine?: ValidationEngine,
    classificationEngine?: ClassificationEngine
  ) {
    this.validationEngine = validationEngine || new ValidationEngine();
    this.classificationEngine = classificationEngine || new ClassificationEngine();
    this.mockDataGenerator = new DefaultMockDataGenerator();
  }

  /**
   * Validate entire application data consistency
   */
  public async validateApplicationConsistency(
    pageData: {
      page1?: CrossPagePosition[];
      page2?: CrossPagePosition[];
      page3?: CrossPagePosition[];
      separated?: CrossPagePosition[];
      page4Direct?: CrossPagePosition[];
      page4Indirect?: CrossPagePosition[];
    },
    scenario?: ValidationScenario
  ): Promise<DataConsistencyReport> {
    try {
      validationLogger.logInfo('Starting comprehensive data consistency validation', {
        scenario: scenario?.name || 'manual',
        pageDataKeys: Object.keys(pageData)
      });

      // Clear previous validation data
      this.validationEngine.clearPositions();

      // Register all page data
      const allDetailedPositions: CrossPagePosition[] = [];
      
      if (pageData.page1) {
        this.validationEngine.registerPositions('page1', pageData.page1);
        allDetailedPositions.push(...pageData.page1);
      }
      
      if (pageData.page2) {
        this.validationEngine.registerPositions('page2', pageData.page2);
        allDetailedPositions.push(...pageData.page2);
      }
      
      if (pageData.page3) {
        this.validationEngine.registerPositions('page3', pageData.page3);
        allDetailedPositions.push(...pageData.page3);
      }
      
      if (pageData.separated) {
        this.validationEngine.registerPositions('separated', pageData.separated);
        allDetailedPositions.push(...pageData.separated);
      }

      // Run consistency validation
      const consistencyValidation = this.validationEngine.validateConsistency();

      // Run aggregation validation if aggregation data is provided
      let aggregationValidation: AggregationValidationResult | null = null;
      if (pageData.page4Direct && pageData.page4Indirect) {
        aggregationValidation = this.validationEngine.validateAggregation(
          pageData.page4Direct,
          pageData.page4Indirect,
          allDetailedPositions
        );
      }

      // Generate comprehensive analysis
      const report = await this.generateComprehensiveReport(
        consistencyValidation,
        aggregationValidation,
        allDetailedPositions,
        scenario || null
      );

      validationLogger.logInfo('Data consistency validation completed', {
        overallHealth: report.overallHealth,
        totalPositions: report.summary.totalPositions,
        criticalIssues: report.summary.criticalIssueCount
      });

      return report;

    } catch (error) {
      validationLogger.logSystemError(
        error instanceof Error ? error : new Error('Unknown validation error'),
        'DataConsistencyValidator.validateApplicationConsistency'
      );

      // Return a fallback report
      return this.createFallbackReport(scenario || null, error);
    }
  }

  /**
   * Run automated testing with different configuration scenarios
   */
  public async runAutomatedValidationTests(
    scenarios?: ValidationScenario[]
  ): Promise<{
    results: DataConsistencyReport[];
    summary: {
      totalScenarios: number;
      passedScenarios: number;
      failedScenarios: number;
      criticalIssues: number;
      overallStatus: 'pass' | 'warning' | 'fail';
    };
  }> {
    const testScenarios = scenarios || this.getDefaultTestScenarios();
    const results: DataConsistencyReport[] = [];
    let passedScenarios = 0;
    let failedScenarios = 0;
    let totalCriticalIssues = 0;

    validationLogger.logInfo('Starting automated validation tests', {
      scenarioCount: testScenarios.length
    });

    for (const scenario of testScenarios) {
      try {
        validationLogger.logInfo(`Running validation scenario: ${scenario.name}`);

        // Generate mock data for the scenario
        const mockData = this.generateMockDataForScenario(scenario);

        // Run validation
        const report = await this.validateApplicationConsistency(mockData, scenario);
        results.push(report);

        // Track results
        if (report.overallHealth === 'healthy') {
          passedScenarios++;
        } else {
          failedScenarios++;
        }

        totalCriticalIssues += report.summary.criticalIssueCount;

        validationLogger.logInfo(`Scenario ${scenario.name} completed`, {
          health: report.overallHealth,
          criticalIssues: report.summary.criticalIssueCount
        });

      } catch (error) {
        failedScenarios++;
        validationLogger.logSystemError(
          error instanceof Error ? error : new Error('Unknown scenario error'),
          `Automated test scenario: ${scenario.name}`
        );

        // Add fallback report for failed scenario
        results.push(this.createFallbackReport(scenario, error));
      }
    }

    const overallStatus: 'pass' | 'warning' | 'fail' = 
      failedScenarios === 0 ? (totalCriticalIssues === 0 ? 'pass' : 'warning') : 'fail';

    const summary = {
      totalScenarios: testScenarios.length,
      passedScenarios,
      failedScenarios,
      criticalIssues: totalCriticalIssues,
      overallStatus
    };

    validationLogger.logInfo('Automated validation tests completed', summary);

    return { results, summary };
  }

  /**
   * Generate validation summary report
   */
  public generateValidationSummaryReport(
    reports: DataConsistencyReport[]
  ): {
    executionSummary: {
      totalReports: number;
      healthyReports: number;
      warningReports: number;
      criticalReports: number;
      averagePositionsPerReport: number;
    };
    classificationTrends: {
      averageDirectPercentage: number;
      averageIndirectPercentage: number;
      averageOHPercentage: number;
      consistencyScore: number;
    };
    commonIssues: {
      issue: string;
      frequency: number;
      affectedReports: number;
      severity: string;
    }[];
    recommendations: string[];
    detailedFindings: string[];
  } {
    const executionSummary = {
      totalReports: reports.length,
      healthyReports: reports.filter(r => r.overallHealth === 'healthy').length,
      warningReports: reports.filter(r => r.overallHealth === 'warning').length,
      criticalReports: reports.filter(r => r.overallHealth === 'critical').length,
      averagePositionsPerReport: reports.reduce((sum, r) => sum + r.summary.totalPositions, 0) / reports.length || 0
    };

    const classificationTrends = {
      averageDirectPercentage: reports.reduce((sum, r) => sum + r.classificationDistribution.direct.percentage, 0) / reports.length || 0,
      averageIndirectPercentage: reports.reduce((sum, r) => sum + r.classificationDistribution.indirect.percentage, 0) / reports.length || 0,
      averageOHPercentage: reports.reduce((sum, r) => sum + r.classificationDistribution.OH.percentage, 0) / reports.length || 0,
      consistencyScore: reports.reduce((sum, r) => sum + (r.summary.validPositions / Math.max(r.summary.totalPositions, 1)), 0) / reports.length || 0
    };

    // Analyze common issues
    const issueMap = new Map<string, { frequency: number; affectedReports: number; severity: string }>();
    
    reports.forEach(report => {
      const reportIssues = new Set<string>();
      
      report.criticalIssues.forEach(issue => {
        if (!reportIssues.has(issue.description)) {
          reportIssues.add(issue.description);
          
          if (!issueMap.has(issue.description)) {
            issueMap.set(issue.description, {
              frequency: 0,
              affectedReports: 0,
              severity: issue.severity
            });
          }
          
          const issueData = issueMap.get(issue.description)!;
          issueData.frequency++;
          issueData.affectedReports++;
        }
      });
    });

    const commonIssues = Array.from(issueMap.entries())
      .map(([issue, data]) => ({ issue, ...data }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10); // Top 10 issues

    // Generate recommendations
    const recommendations = this.generateRecommendations(reports, commonIssues);

    // Generate detailed findings
    const detailedFindings = this.generateDetailedFindings(reports, executionSummary, classificationTrends);

    return {
      executionSummary,
      classificationTrends,
      commonIssues,
      recommendations,
      detailedFindings
    };
  }

  /**
   * Quick validation check for development use
   */
  public async quickValidationCheck(
    pageData: {
      page1?: CrossPagePosition[];
      page2?: CrossPagePosition[];
      page3?: CrossPagePosition[];
      separated?: CrossPagePosition[];
    }
  ): Promise<{
    isHealthy: boolean;
    criticalIssueCount: number;
    warningCount: number;
    quickSummary: string;
    recommendations: string[];
  }> {
    try {
      const report = await this.validateApplicationConsistency(pageData);
      
      return {
        isHealthy: report.overallHealth === 'healthy',
        criticalIssueCount: report.summary.criticalIssueCount,
        warningCount: report.summary.warningCount,
        quickSummary: this.generateQuickSummary(report),
        recommendations: report.recommendations.slice(0, 3) // Top 3 recommendations
      };
    } catch (error) {
      return {
        isHealthy: false,
        criticalIssueCount: 1,
        warningCount: 0,
        quickSummary: 'Validation failed due to system error',
        recommendations: ['Check system logs for detailed error information']
      };
    }
  }

  // Private helper methods

  private async generateComprehensiveReport(
    consistencyValidation: ValidationReport,
    aggregationValidation: AggregationValidationResult | null,
    allPositions: CrossPagePosition[],
    scenario: ValidationScenario | null
  ): Promise<DataConsistencyReport> {
    // Calculate classification distribution
    const classificationDistribution = this.calculateClassificationDistribution(allPositions);
    
    // Analyze by department and level
    const { departmentAnalysis, levelAnalysis } = this.analyzeByDepartmentAndLevel(
      allPositions, 
      consistencyValidation.inconsistencies
    );

    // Identify critical issues
    const criticalIssues = this.identifyCriticalIssues(
      consistencyValidation,
      aggregationValidation,
      allPositions
    );

    // Generate recommendations
    const recommendations = this.generateRecommendationsForReport(
      consistencyValidation,
      aggregationValidation,
      criticalIssues
    );

    // Determine overall health
    const overallHealth = this.determineOverallHealth(
      consistencyValidation,
      aggregationValidation,
      criticalIssues
    );

    // Create summary
    const summary = {
      totalPositions: allPositions.length,
      validPositions: consistencyValidation.summary.validPositions,
      inconsistentPositions: consistencyValidation.summary.inconsistentPositions,
      aggregationMismatches: aggregationValidation?.mismatches.length || 0,
      criticalIssueCount: criticalIssues.filter(i => i.severity === 'critical').length,
      warningCount: criticalIssues.filter(i => i.severity === 'medium' || i.severity === 'low').length
    };

    return {
      timestamp: new Date(),
      scenario,
      consistencyValidation,
      aggregationValidation,
      classificationDistribution,
      departmentAnalysis,
      levelAnalysis,
      criticalIssues,
      recommendations,
      overallHealth,
      summary
    };
  }

  private calculateClassificationDistribution(positions: CrossPagePosition[]): DataConsistencyReport['classificationDistribution'] {
    const directPositions: string[] = [];
    const indirectPositions: string[] = [];
    const ohPositions: string[] = [];

    positions.forEach(position => {
      const classification = classifyPosition(
        position.department,
        position.level,
        position.processType,
        position.subtitle,
        position.title
      );

      const positionId = `${position.department} ${position.level}${position.subtitle ? ` (${position.subtitle})` : ''}`;

      switch (classification) {
        case 'direct':
          directPositions.push(positionId);
          break;
        case 'indirect':
          indirectPositions.push(positionId);
          break;
        case 'OH':
          ohPositions.push(positionId);
          break;
      }
    });

    const total = positions.length || 1; // Avoid division by zero

    return {
      direct: {
        count: directPositions.length,
        percentage: (directPositions.length / total) * 100,
        positions: directPositions
      },
      indirect: {
        count: indirectPositions.length,
        percentage: (indirectPositions.length / total) * 100,
        positions: indirectPositions
      },
      OH: {
        count: ohPositions.length,
        percentage: (ohPositions.length / total) * 100,
        positions: ohPositions
      }
    };
  }

  private analyzeByDepartmentAndLevel(
    positions: CrossPagePosition[],
    inconsistencies: Inconsistency[]
  ): {
    departmentAnalysis: DataConsistencyReport['departmentAnalysis'];
    levelAnalysis: DataConsistencyReport['levelAnalysis'];
  } {
    const departmentAnalysis: DataConsistencyReport['departmentAnalysis'] = {};
    const levelAnalysis: DataConsistencyReport['levelAnalysis'] = {};

    // Initialize analysis objects
    positions.forEach(position => {
      const classification = classifyPosition(
        position.department,
        position.level,
        position.processType,
        position.subtitle,
        position.title
      );

      // Department analysis
      if (!departmentAnalysis[position.department]) {
        departmentAnalysis[position.department] = {
          totalPositions: 0,
          directCount: 0,
          indirectCount: 0,
          ohCount: 0,
          inconsistencies: 0,
          issues: []
        };
      }

      departmentAnalysis[position.department].totalPositions++;
      switch (classification) {
        case 'direct':
          departmentAnalysis[position.department].directCount++;
          break;
        case 'indirect':
          departmentAnalysis[position.department].indirectCount++;
          break;
        case 'OH':
          departmentAnalysis[position.department].ohCount++;
          break;
      }

      // Level analysis
      if (!levelAnalysis[position.level]) {
        levelAnalysis[position.level] = {
          totalPositions: 0,
          directCount: 0,
          indirectCount: 0,
          ohCount: 0,
          inconsistencies: 0,
          issues: []
        };
      }

      levelAnalysis[position.level].totalPositions++;
      switch (classification) {
        case 'direct':
          levelAnalysis[position.level].directCount++;
          break;
        case 'indirect':
          levelAnalysis[position.level].indirectCount++;
          break;
        case 'OH':
          levelAnalysis[position.level].ohCount++;
          break;
      }
    });

    // Add inconsistency counts and issues
    inconsistencies.forEach(inconsistency => {
      if (departmentAnalysis[inconsistency.department]) {
        departmentAnalysis[inconsistency.department].inconsistencies++;
        departmentAnalysis[inconsistency.department].issues.push(inconsistency.reason);
      }

      if (levelAnalysis[inconsistency.level]) {
        levelAnalysis[inconsistency.level].inconsistencies++;
        levelAnalysis[inconsistency.level].issues.push(inconsistency.reason);
      }
    });

    return { departmentAnalysis, levelAnalysis };
  }

  private identifyCriticalIssues(
    consistencyValidation: ValidationReport,
    aggregationValidation: AggregationValidationResult | null,
    allPositions: CrossPagePosition[]
  ): CriticalIssue[] {
    const criticalIssues: CriticalIssue[] = [];

    // Classification inconsistencies
    consistencyValidation.inconsistencies.forEach(inconsistency => {
      criticalIssues.push({
        type: 'classification_inconsistency',
        severity: inconsistency.severity === 'error' ? 'critical' : 'medium',
        description: inconsistency.reason,
        affectedPositions: [inconsistency.positionId],
        recommendation: `Ensure ${inconsistency.department} ${inconsistency.level} is consistently classified as ${inconsistency.expectedClassification} across all pages`,
        pages: inconsistency.pages
      });
    });

    // Aggregation mismatches
    if (aggregationValidation && !aggregationValidation.isValid) {
      aggregationValidation.mismatches.forEach(mismatch => {
        criticalIssues.push({
          type: 'aggregation_mismatch',
          severity: 'high',
          description: mismatch.reason,
          affectedPositions: [`${mismatch.department} ${mismatch.level}`],
          recommendation: `Review aggregation logic for ${mismatch.department} ${mismatch.level} positions`,
          pages: ['page4-direct', 'page4-indirect']
        });
      });
    }

    // Missing critical positions (CE TM Mixing should be direct)
    const ceMixingPositions = allPositions.filter(p => 
      p.department === 'CE' && 
      p.level === 'TM' && 
      (p.subtitle?.includes('Mixing') || p.title?.includes('Mixing'))
    );

    if (ceMixingPositions.length === 0) {
      criticalIssues.push({
        type: 'missing_positions',
        severity: 'medium',
        description: 'No CE TM Mixing positions found - this is typically expected in production data',
        affectedPositions: [],
        recommendation: 'Verify if CE TM Mixing positions should be present in the current configuration',
        pages: ['page1']
      });
    }

    // Duplicate position detection
    const positionMap = new Map<string, CrossPagePosition[]>();
    allPositions.forEach(position => {
      const key = `${position.department}-${position.level}-${position.subtitle || ''}`;
      if (!positionMap.has(key)) {
        positionMap.set(key, []);
      }
      positionMap.get(key)!.push(position);
    });

    positionMap.forEach((positions, key) => {
      if (positions.length > 1) {
        const sources = [...new Set(positions.map(p => p.source))];
        if (sources.length > 1) {
          // This is expected for cross-page validation
          return;
        }

        criticalIssues.push({
          type: 'duplicate_positions',
          severity: 'medium',
          description: `Duplicate positions found: ${key}`,
          affectedPositions: positions.map(p => p.id),
          recommendation: 'Review data source to eliminate duplicate position entries',
          pages: sources
        });
      }
    });

    return criticalIssues;
  }

  private generateRecommendationsForReport(
    consistencyValidation: ValidationReport,
    aggregationValidation: AggregationValidationResult | null,
    criticalIssues: CriticalIssue[]
  ): string[] {
    const recommendations: string[] = [];

    // Consistency recommendations
    if (!consistencyValidation.isValid) {
      recommendations.push('Review and update classification logic to ensure consistency across all pages');
      
      const departmentIssues = new Set(consistencyValidation.inconsistencies.map(i => i.department));
      if (departmentIssues.size > 0) {
        recommendations.push(`Focus on departments with issues: ${Array.from(departmentIssues).join(', ')}`);
      }
    }

    // Aggregation recommendations
    if (aggregationValidation && !aggregationValidation.isValid) {
      recommendations.push('Update aggregation page logic to match detailed view classifications');
      
      if (aggregationValidation.mismatches.some(m => m.department === 'CE')) {
        recommendations.push('Verify CE TM Mixing positions appear in direct aggregation page');
      }
    }

    // Critical issue recommendations
    const highSeverityIssues = criticalIssues.filter(i => i.severity === 'critical' || i.severity === 'high');
    if (highSeverityIssues.length > 0) {
      recommendations.push('Address critical and high-severity issues first to improve data integrity');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Data consistency is good - continue monitoring for any changes');
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  private determineOverallHealth(
    consistencyValidation: ValidationReport,
    aggregationValidation: AggregationValidationResult | null,
    criticalIssues: CriticalIssue[]
  ): 'healthy' | 'warning' | 'critical' {
    const criticalCount = criticalIssues.filter(i => i.severity === 'critical').length;
    const highCount = criticalIssues.filter(i => i.severity === 'high').length;

    if (criticalCount > 0) {
      return 'critical';
    }

    if (!consistencyValidation.isValid || 
        (aggregationValidation && !aggregationValidation.isValid) ||
        highCount > 0) {
      return 'warning';
    }

    return 'healthy';
  }

  private getDefaultTestScenarios(): ValidationScenario[] {
    return [
      {
        name: 'minimal_configuration',
        description: 'Test with minimal line count and basic model selection',
        lineCount: 1,
        modelSelection: ['Model A'],
        expectedDirectCount: 2,
        expectedIndirectCount: 8,
        expectedOHCount: 5
      },
      {
        name: 'standard_configuration',
        description: 'Test with standard production configuration',
        lineCount: 3,
        modelSelection: ['Model A', 'Model B'],
        expectedDirectCount: 6,
        expectedIndirectCount: 15,
        expectedOHCount: 12
      },
      {
        name: 'maximum_configuration',
        description: 'Test with maximum line count and all models',
        lineCount: 5,
        modelSelection: ['Model A', 'Model B', 'Model C'],
        expectedDirectCount: 10,
        expectedIndirectCount: 25,
        expectedOHCount: 20
      },
      {
        name: 'separated_processes_only',
        description: 'Test with only separated processes (No-sew, HF Welding)',
        lineCount: 0,
        modelSelection: [],
        expectedDirectCount: 0,
        expectedIndirectCount: 4,
        expectedOHCount: 2
      }
    ];
  }

  private generateMockDataForScenario(scenario: ValidationScenario): {
    page1: CrossPagePosition[];
    page2: CrossPagePosition[];
    page3: CrossPagePosition[];
    separated: CrossPagePosition[];
    page4Direct: CrossPagePosition[];
    page4Indirect: CrossPagePosition[];
  } {
    const page1 = this.mockDataGenerator.generatePage1Data(scenario.lineCount);
    const page2 = this.mockDataGenerator.generatePage2Data();
    const page3 = this.mockDataGenerator.generatePage3Data();
    const separated = this.mockDataGenerator.generateSeparatedData();
    
    const allDetailed = [...page1, ...page2, ...page3, ...separated];
    const { directPage, indirectPage } = this.mockDataGenerator.generateAggregationData(allDetailed);

    return {
      page1,
      page2,
      page3,
      separated,
      page4Direct: directPage,
      page4Indirect: indirectPage
    };
  }

  private createFallbackReport(scenario: ValidationScenario | null, error: any): DataConsistencyReport {
    return {
      timestamp: new Date(),
      scenario,
      consistencyValidation: {
        isValid: false,
        inconsistencies: [],
        summary: {
          totalPositions: 0,
          validPositions: 0,
          inconsistentPositions: 0,
          classificationCounts: { direct: 0, indirect: 0, OH: 0 },
          pagesCovered: []
        },
        timestamp: new Date()
      },
      aggregationValidation: null,
      classificationDistribution: {
        direct: { count: 0, percentage: 0, positions: [] },
        indirect: { count: 0, percentage: 0, positions: [] },
        OH: { count: 0, percentage: 0, positions: [] }
      },
      departmentAnalysis: {},
      levelAnalysis: {},
      criticalIssues: [{
        type: 'invalid_data',
        severity: 'critical',
        description: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        affectedPositions: [],
        recommendation: 'Check system logs and data integrity',
        pages: []
      }],
      recommendations: ['Fix system errors before running validation'],
      overallHealth: 'critical',
      summary: {
        totalPositions: 0,
        validPositions: 0,
        inconsistentPositions: 0,
        aggregationMismatches: 0,
        criticalIssueCount: 1,
        warningCount: 0
      }
    };
  }

  private generateRecommendations(
    reports: DataConsistencyReport[],
    commonIssues: { issue: string; frequency: number; affectedReports: number; severity: string }[]
  ): string[] {
    const recommendations: string[] = [];

    // Based on common issues
    commonIssues.slice(0, 3).forEach(issue => {
      if (issue.severity === 'critical') {
        recommendations.push(`Critical: Address "${issue.issue}" which affects ${issue.affectedReports} reports`);
      }
    });

    // Based on overall trends
    const healthyReports = reports.filter(r => r.overallHealth === 'healthy').length;
    const healthyPercentage = (healthyReports / reports.length) * 100;

    if (healthyPercentage < 50) {
      recommendations.push('Focus on improving overall data consistency - less than 50% of reports are healthy');
    } else if (healthyPercentage < 80) {
      recommendations.push('Good progress on data consistency - aim to get above 80% healthy reports');
    }

    return recommendations;
  }

  private generateDetailedFindings(
    reports: DataConsistencyReport[],
    executionSummary: any,
    classificationTrends: any
  ): string[] {
    const findings: string[] = [];

    findings.push(`Analyzed ${executionSummary.totalReports} validation reports`);
    findings.push(`Average positions per report: ${Math.round(executionSummary.averagePositionsPerReport)}`);
    findings.push(`Classification distribution: ${Math.round(classificationTrends.averageDirectPercentage)}% Direct, ${Math.round(classificationTrends.averageIndirectPercentage)}% Indirect, ${Math.round(classificationTrends.averageOHPercentage)}% OH`);
    findings.push(`Overall consistency score: ${Math.round(classificationTrends.consistencyScore * 100)}%`);

    if (executionSummary.criticalReports > 0) {
      findings.push(`${executionSummary.criticalReports} reports have critical issues requiring immediate attention`);
    }

    return findings;
  }

  private generateQuickSummary(report: DataConsistencyReport): string {
    const { summary, overallHealth } = report;
    
    if (overallHealth === 'healthy') {
      return `✅ All ${summary.totalPositions} positions are consistently classified with no critical issues`;
    } else if (overallHealth === 'warning') {
      return `⚠️ ${summary.inconsistentPositions} of ${summary.totalPositions} positions have issues (${summary.criticalIssueCount} critical)`;
    } else {
      return `❌ Critical data consistency issues found: ${summary.criticalIssueCount} critical issues affecting ${summary.inconsistentPositions} positions`;
    }
  }
}

/**
 * Default Mock Data Generator Implementation
 */
class DefaultMockDataGenerator implements MockDataGenerator {
  generatePage1Data(lineCount: number): CrossPagePosition[] {
    const positions: CrossPagePosition[] = [];
    
    // Base positions that always exist
    positions.push(
      { id: 'line-vsm', department: 'Line', level: 'VSM', title: 'Line VSM', source: 'page1' },
      { id: 'line-avsm', department: 'Line', level: 'A.VSM', title: 'Line A.VSM', source: 'page1' }
    );

    // Add positions based on line count
    for (let i = 1; i <= lineCount; i++) {
      positions.push(
        { id: `line-gl-${i}`, department: 'Line', level: 'GL', title: `Line GL ${i}`, source: 'page1' },
        { id: `quality-gl-${i}`, department: 'Quality', level: 'GL', title: `Quality GL ${i}`, source: 'page1' }
      );
    }

    // Add CE TM Mixing (should be direct)
    positions.push({
      id: 'ce-tm-mixing',
      department: 'CE',
      level: 'TM',
      title: 'CE TM',
      subtitle: 'Mixing',
      source: 'page1'
    });

    return positions;
  }

  generatePage2Data(): CrossPagePosition[] {
    return [
      { id: 'admin-tm', department: 'Admin', level: 'TM', title: 'Admin TM', source: 'page2' },
      { id: 'raw-material-tm', department: 'Raw Material', level: 'TM', title: 'Raw Material TM', source: 'page2' },
      { id: 'plant-prod-tm', department: 'Plant Production', level: 'TM', title: 'Plant Production TM', source: 'page2' },
      { id: 'acc-market-tm', department: 'ACC Market', level: 'TM', title: 'ACC Market TM', source: 'page2' }
    ];
  }

  generatePage3Data(): CrossPagePosition[] {
    return [
      { id: 'tpm-tm', department: 'TPM', level: 'TM', title: 'TPM TM', source: 'page3' },
      { id: 'security-tm', department: 'Security', level: 'TM', title: 'Security TM', source: 'page3' }
    ];
  }

  generateSeparatedData(): CrossPagePosition[] {
    return [
      { id: 'nosew-gl', department: 'No-sew', level: 'GL', title: 'No-sew GL', source: 'separated' },
      { id: 'hf-welding-tm', department: 'HF Welding', level: 'TM', title: 'HF Welding TM', source: 'separated' }
    ];
  }

  generateAggregationData(detailedPositions: CrossPagePosition[]): {
    directPage: CrossPagePosition[];
    indirectPage: CrossPagePosition[];
  } {
    const directPage: CrossPagePosition[] = [];
    const indirectPage: CrossPagePosition[] = [];

    detailedPositions.forEach(position => {
      const classification = classifyPosition(
        position.department,
        position.level,
        position.processType,
        position.subtitle,
        position.title
      );

      const aggregatedPosition = {
        ...position,
        id: `${position.id}-agg`,
        source: classification === 'direct' ? 'page4-direct' : 'page4-indirect'
      };

      if (classification === 'direct') {
        directPage.push(aggregatedPosition);
      } else {
        indirectPage.push(aggregatedPosition);
      }
    });

    return { directPage, indirectPage };
  }
}

// Export singleton instance and utility functions
export const dataConsistencyValidator = new DataConsistencyValidator();

/**
 * Utility function to validate entire application data consistency
 */
export const validateApplicationConsistency = async (
  pageData: {
    page1?: CrossPagePosition[];
    page2?: CrossPagePosition[];
    page3?: CrossPagePosition[];
    separated?: CrossPagePosition[];
    page4Direct?: CrossPagePosition[];
    page4Indirect?: CrossPagePosition[];
  },
  scenario?: ValidationScenario
): Promise<DataConsistencyReport> => {
  return dataConsistencyValidator.validateApplicationConsistency(pageData, scenario);
};

/**
 * Utility function to run automated validation tests
 */
export const runAutomatedValidationTests = async (
  scenarios?: ValidationScenario[]
) => {
  return dataConsistencyValidator.runAutomatedValidationTests(scenarios);
};

/**
 * Utility function for quick validation check
 */
export const quickValidationCheck = async (
  pageData: {
    page1?: CrossPagePosition[];
    page2?: CrossPagePosition[];
    page3?: CrossPagePosition[];
    separated?: CrossPagePosition[];
  }
) => {
  return dataConsistencyValidator.quickValidationCheck(pageData);
};