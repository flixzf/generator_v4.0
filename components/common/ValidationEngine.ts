/**
 * Validation Engine for Personnel Classification Consistency
 * 
 * This module provides validation mechanisms to detect and report classification
 * inconsistencies across different pages and aggregation logic in the organization
 * chart application.
 */

import { Position, classificationEngine, ClassificationEngine } from './ClassificationEngine';
import { validationLogger, ValidationLogger } from './ValidationLogger';

// Validation interfaces
export interface Inconsistency {
  positionId: string;
  department: string;
  level: string;
  title?: string;
  subtitle?: string;
  expectedClassification: 'direct' | 'indirect' | 'OH';
  actualClassification: 'direct' | 'indirect' | 'OH';
  pages: string[];
  reason: string;
  severity: 'error' | 'warning';
}

export interface ValidationSummary {
  totalPositions: number;
  validPositions: number;
  inconsistentPositions: number;
  classificationCounts: {
    direct: number;
    indirect: number;
    OH: number;
  };
  pagesCovered: string[];
}

export interface ValidationReport {
  isValid: boolean;
  inconsistencies: Inconsistency[];
  summary: ValidationSummary;
  timestamp: Date;
}

export interface AggregationValidationResult {
  isValid: boolean;
  directPageTotal: number;
  indirectPageTotal: number;
  ohPageTotal: number;
  detailedViewTotal: number;
  mismatches: AggregationMismatch[];
}

export interface AggregationMismatch {
  department: string;
  level: string;
  detailedCount: number;
  aggregatedCount: number;
  classification: 'direct' | 'indirect' | 'OH';
  reason: string;
}

export interface PositionValidationResult {
  position: Position;
  isValid: boolean;
  expectedClassification: 'direct' | 'indirect' | 'OH';
  actualClassification?: 'direct' | 'indirect' | 'OH';
  issues: string[];
  warnings: string[];
}

// Position data structure for cross-page validation
export interface CrossPagePosition {
  id: string;
  department: string;
  level: 'VSM' | 'A.VSM' | 'GL' | 'TL' | 'TM' | 'DEPT';
  title?: string;
  subtitle?: string;
  processType?: string;
  source: string;
  classification?: 'direct' | 'indirect' | 'OH';
  metadata?: {
    lineIndex?: number;
    manpower?: number;
    processName?: string;
  };
}

/**
 * Validation Engine Implementation
 */
export class ValidationEngine {
  private classificationEngine: ClassificationEngine;
  private positions: Map<string, CrossPagePosition[]> = new Map();
  private logger: ValidationLogger;

  constructor(classificationEngine?: ClassificationEngine, logger?: ValidationLogger) {
    this.classificationEngine = classificationEngine || new ClassificationEngine();
    this.logger = logger || validationLogger;
  }

  /**
   * Register positions from a specific page for validation
   */
  public registerPositions(pageName: string, positions: CrossPagePosition[]): void {
    this.positions.set(pageName, positions);
  }

  /**
   * Clear all registered positions
   */
  public clearPositions(): void {
    this.positions.clear();
  }

  /**
   * Validate consistency across all registered pages
   */
  public validateConsistency(): ValidationReport {
    try {
      this.logger.logInfo('Starting validation consistency check');
      
      const inconsistencies: Inconsistency[] = [];
      const positionMap = new Map<string, CrossPagePosition[]>();
      const classificationCounts = { direct: 0, indirect: 0, OH: 0 };
      let totalPositions = 0;

      // Group positions by unique identifier (department + level + subtitle)
      for (const [pageName, pagePositions] of this.positions) {
        for (const position of pagePositions) {
          try {
            const key = this.generatePositionKey(position);
            if (!positionMap.has(key)) {
              positionMap.set(key, []);
            }
            positionMap.get(key)!.push({ ...position, source: pageName });
            totalPositions++;
          } catch (error) {
            this.logger.logSystemError(
              error instanceof Error ? error : new Error('Unknown error processing position'),
              `Processing position from ${pageName}`
            );
          }
        }
      }

      // Check each position group for consistency
      for (const [positionKey, positionGroup] of positionMap) {
        try {
          const validationResult = this.validatePositionGroup(positionKey, positionGroup);
          if (!validationResult.isValid) {
            inconsistencies.push(...validationResult.inconsistencies);
          }

          // Count classifications (use expected classification)
          const expectedClassification = this.getExpectedClassification(positionGroup[0]);
          classificationCounts[expectedClassification]++;
        } catch (error) {
          this.logger.logSystemError(
            error instanceof Error ? error : new Error('Unknown error validating position group'),
            `Validating position group: ${positionKey}`
          );
        }
      }

      const summary: ValidationSummary = {
        totalPositions,
        validPositions: totalPositions - inconsistencies.length,
        inconsistentPositions: inconsistencies.length,
        classificationCounts,
        pagesCovered: Array.from(this.positions.keys())
      };

      const report: ValidationReport = {
        isValid: inconsistencies.length === 0,
        inconsistencies,
        summary,
        timestamp: new Date()
      };

      // Log the validation report
      this.logger.logValidationReport(report);

      return report;

    } catch (error) {
      this.logger.logSystemError(
        error instanceof Error ? error : new Error('Unknown error in validateConsistency'),
        'ValidationEngine.validateConsistency'
      );

      // Return a fallback report
      return {
        isValid: false,
        inconsistencies: [{
          positionId: 'system-error',
          department: 'SYSTEM',
          level: 'ERROR',
          expectedClassification: 'indirect',
          actualClassification: 'indirect',
          pages: [],
          reason: 'System error during validation',
          severity: 'error'
        }],
        summary: {
          totalPositions: 0,
          validPositions: 0,
          inconsistentPositions: 1,
          classificationCounts: { direct: 0, indirect: 0, OH: 0 },
          pagesCovered: []
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Validate aggregation logic against detailed views
   */
  public validateAggregation(
    directPagePositions: CrossPagePosition[],
    indirectPagePositions: CrossPagePosition[],
    detailedPositions: CrossPagePosition[]
  ): AggregationValidationResult {
    try {
      this.logger.logInfo('Starting aggregation validation');
      
      const mismatches: AggregationMismatch[] = [];

      // Count positions by classification in detailed views
      const detailedCounts = this.countPositionsByClassification(detailedPositions);
      
      // Count positions in aggregation pages
      const directPageTotal = directPagePositions.length;
      const indirectPageTotal = indirectPagePositions.length;
      const ohPageTotal = 0; // Assuming OH positions are included in indirect page

      // Validate direct page
      try {
        const directMismatches = this.validateAggregationPage(
          directPagePositions,
          'direct',
          detailedCounts.direct
        );
        mismatches.push(...directMismatches);
      } catch (error) {
        this.logger.logSystemError(
          error instanceof Error ? error : new Error('Unknown error validating direct page'),
          'validateAggregation - direct page validation'
        );
      }

      // Validate indirect page (includes OH)
      try {
        const expectedIndirectTotal = detailedCounts.indirect + detailedCounts.OH;
        const indirectMismatches = this.validateAggregationPage(
          indirectPagePositions,
          'indirect',
          expectedIndirectTotal
        );
        mismatches.push(...indirectMismatches);
      } catch (error) {
        this.logger.logSystemError(
          error instanceof Error ? error : new Error('Unknown error validating indirect page'),
          'validateAggregation - indirect page validation'
        );
      }

      const detailedViewTotal = detailedCounts.direct + detailedCounts.indirect + detailedCounts.OH;
      const aggregationTotal = directPageTotal + indirectPageTotal + ohPageTotal;

      // Check total consistency
      if (detailedViewTotal !== aggregationTotal) {
        const mismatch: AggregationMismatch = {
          department: 'ALL',
          level: 'ALL',
          detailedCount: detailedViewTotal,
          aggregatedCount: aggregationTotal,
          classification: 'direct', // placeholder
          reason: `Total aggregation mismatch: detailed views have ${detailedViewTotal} positions, aggregation pages have ${aggregationTotal}`
        };
        mismatches.push(mismatch);
        
        this.logger.logAggregationFailure(
          'ALL',
          'ALL',
          detailedViewTotal,
          aggregationTotal,
          mismatch.reason
        );
      }

      const result: AggregationValidationResult = {
        isValid: mismatches.length === 0,
        directPageTotal,
        indirectPageTotal,
        ohPageTotal,
        detailedViewTotal,
        mismatches
      };

      // Log the aggregation report
      this.logger.logAggregationReport(result);

      return result;

    } catch (error) {
      this.logger.logSystemError(
        error instanceof Error ? error : new Error('Unknown error in validateAggregation'),
        'ValidationEngine.validateAggregation'
      );

      // Return a fallback result
      return {
        isValid: false,
        directPageTotal: directPagePositions?.length || 0,
        indirectPageTotal: indirectPagePositions?.length || 0,
        ohPageTotal: 0,
        detailedViewTotal: detailedPositions?.length || 0,
        mismatches: [{
          department: 'SYSTEM',
          level: 'ERROR',
          detailedCount: 0,
          aggregatedCount: 0,
          classification: 'direct',
          reason: 'System error during aggregation validation'
        }]
      };
    }
  }

  /**
   * Validate a single position
   */
  public validatePosition(position: CrossPagePosition): PositionValidationResult {
    try {
      const issues: string[] = [];
      const warnings: string[] = [];

      // Check required fields
      if (!position.department) {
        issues.push('Department is required');
      }
      if (!position.level) {
        issues.push('Level is required');
      }

      // Get expected classification with error handling
      let expectedClassification: 'direct' | 'indirect' | 'OH';
      try {
        expectedClassification = this.getExpectedClassification(position);
      } catch (error) {
        this.logger.logSystemError(
          error instanceof Error ? error : new Error('Unknown error getting expected classification'),
          `Validating position: ${position.id || 'unknown'}`
        );
        expectedClassification = 'indirect'; // Fallback
        warnings.push('Could not determine expected classification, using fallback');
      }
      
      // Check if actual classification matches expected
      if (position.classification && position.classification !== expectedClassification) {
        const warning = `Classification mismatch: expected ${expectedClassification}, got ${position.classification}`;
        warnings.push(warning);
        
        this.logger.logWarning(warning, {
          positionId: position.id,
          department: position.department,
          level: position.level,
          expected: expectedClassification,
          actual: position.classification
        });
      }

      // Validate department name
      if (position.department && !this.isValidDepartment(position.department)) {
        const warning = `Unknown department: ${position.department}`;
        warnings.push(warning);
        
        this.logger.logWarning(warning, {
          positionId: position.id,
          department: position.department,
          level: position.level
        });
      }

      const result: PositionValidationResult = {
        position: {
          ...position,
          title: position.title || position.level || 'Unknown'
        } as Position,
        isValid: issues.length === 0,
        expectedClassification,
        actualClassification: position.classification,
        issues,
        warnings
      };

      // Log position validation if there are issues
      if (issues.length > 0 || warnings.length > 0) {
        this.logger.logPositionValidation(result.position, {
          isValid: result.isValid,
          errors: issues,
          warnings
        });
      }

      return result;

    } catch (error) {
      this.logger.logSystemError(
        error instanceof Error ? error : new Error('Unknown error in validatePosition'),
        `Validating position: ${position?.id || 'unknown'}`
      );

      // Return a fallback result
      return {
        position: {
          id: position?.id || 'unknown',
          department: position?.department || 'Unknown',
          level: position?.level || 'TM',
          title: position?.title || 'Unknown',
          source: position?.source || 'page1'
        } as Position,
        isValid: false,
        expectedClassification: 'indirect',
        actualClassification: position?.classification,
        issues: ['System error during position validation'],
        warnings: []
      };
    }
  }

  /**
   * Generate a comprehensive validation report with detailed analysis
   */
  public generateDetailedReport(): ValidationReport & {
    departmentAnalysis: Record<string, {
      totalPositions: number;
      classifications: Record<string, number>;
      inconsistencies: number;
    }>;
    levelAnalysis: Record<string, {
      totalPositions: number;
      classifications: Record<string, number>;
      inconsistencies: number;
    }>;
  } {
    const baseReport = this.validateConsistency();
    const departmentAnalysis: Record<string, any> = {};
    const levelAnalysis: Record<string, any> = {};

    // Analyze by department and level
    for (const [pageName, pagePositions] of this.positions) {
      for (const position of pagePositions) {
        // Department analysis
        if (!departmentAnalysis[position.department]) {
          departmentAnalysis[position.department] = {
            totalPositions: 0,
            classifications: { direct: 0, indirect: 0, OH: 0 },
            inconsistencies: 0
          };
        }
        departmentAnalysis[position.department].totalPositions++;
        
        const expectedClassification = this.getExpectedClassification(position);
        departmentAnalysis[position.department].classifications[expectedClassification]++;

        // Level analysis
        if (!levelAnalysis[position.level]) {
          levelAnalysis[position.level] = {
            totalPositions: 0,
            classifications: { direct: 0, indirect: 0, OH: 0 },
            inconsistencies: 0
          };
        }
        levelAnalysis[position.level].totalPositions++;
        levelAnalysis[position.level].classifications[expectedClassification]++;
      }
    }

    // Count inconsistencies by department and level
    for (const inconsistency of baseReport.inconsistencies) {
      if (departmentAnalysis[inconsistency.department]) {
        departmentAnalysis[inconsistency.department].inconsistencies++;
      }
      if (levelAnalysis[inconsistency.level]) {
        levelAnalysis[inconsistency.level].inconsistencies++;
      }
    }

    return {
      ...baseReport,
      departmentAnalysis,
      levelAnalysis
    };
  }

  // Private helper methods

  private generatePositionKey(position: CrossPagePosition): string {
    return `${position.department}-${position.level}-${position.subtitle || ''}-${position.title || ''}`;
  }

  private validatePositionGroup(
    positionKey: string,
    positions: CrossPagePosition[]
  ): { isValid: boolean; inconsistencies: Inconsistency[] } {
    const inconsistencies: Inconsistency[] = [];
    
    if (positions.length <= 1) {
      return { isValid: true, inconsistencies: [] };
    }

    const expectedClassification = this.getExpectedClassification(positions[0]);
    const pages = positions.map(p => p.source);
    
    // Check if all positions have consistent classification
    for (const position of positions) {
      const actualClassification = position.classification || this.getExpectedClassification(position);
      
      if (actualClassification !== expectedClassification) {
        inconsistencies.push({
          positionId: position.id,
          department: position.department,
          level: position.level,
          title: position.title,
          subtitle: position.subtitle,
          expectedClassification,
          actualClassification,
          pages,
          reason: `Position appears with different classifications across pages: ${pages.join(', ')}`,
          severity: 'error'
        });
      }
    }

    return {
      isValid: inconsistencies.length === 0,
      inconsistencies
    };
  }

  private getExpectedClassification(position: CrossPagePosition): 'direct' | 'indirect' | 'OH' {
    try {
      return this.classificationEngine.classifyPosition(
        position.department,
        position.level,
        position.processType,
        position.subtitle,
        position.title
      );
    } catch (error) {
      this.logger.logClassificationFailure(
        {
          id: position.id || 'unknown',
          department: position.department,
          level: position.level,
          title: position.title || '',
          subtitle: position.subtitle,
          processType: position.processType,
          source: position.source as any
        },
        error instanceof Error ? error.message : 'Unknown classification error'
      );
      
      // Return a safe fallback
      return 'indirect';
    }
  }

  private countPositionsByClassification(positions: CrossPagePosition[]): {
    direct: number;
    indirect: number;
    OH: number;
  } {
    const counts = { direct: 0, indirect: 0, OH: 0 };
    
    for (const position of positions) {
      const classification = this.getExpectedClassification(position);
      counts[classification]++;
    }
    
    return counts;
  }

  private validateAggregationPage(
    aggregationPositions: CrossPagePosition[],
    expectedClassification: 'direct' | 'indirect' | 'OH',
    expectedCount: number
  ): AggregationMismatch[] {
    const mismatches: AggregationMismatch[] = [];
    const actualCount = aggregationPositions.length;

    if (actualCount !== expectedCount) {
      mismatches.push({
        department: 'ALL',
        level: 'ALL',
        detailedCount: expectedCount,
        aggregatedCount: actualCount,
        classification: expectedClassification,
        reason: `${expectedClassification} aggregation page has ${actualCount} positions, expected ${expectedCount}`
      });
    }

    // Check if positions in aggregation page have correct classification
    for (const position of aggregationPositions) {
      const actualClassification = this.getExpectedClassification(position);
      if (actualClassification !== expectedClassification && 
          !(expectedClassification === 'indirect' && actualClassification === 'OH')) {
        mismatches.push({
          department: position.department,
          level: position.level,
          detailedCount: 1,
          aggregatedCount: 0,
          classification: expectedClassification,
          reason: `Position ${position.department} ${position.level} is classified as ${actualClassification} but appears in ${expectedClassification} aggregation page`
        });
      }
    }

    return mismatches;
  }

  private isValidDepartment(department: string): boolean {
    const validDepartments = [
      'Line', 'Admin', 'Small Tooling', 'Raw Material', 'Sub Material',
      'ACC Market', 'P&L Market', 'Bottom Market', 'FG WH', 'Quality',
      'CE', 'TPM', 'CQM', 'Lean', 'Security', 'RMCC',
      'No-sew', 'HF Welding', 'Separated', 'Plant Production'
    ];
    
    return validDepartments.includes(department);
  }
}

// Export singleton instance
export const validationEngine = new ValidationEngine();

// Utility functions for easy access
export const validateConsistency = (): ValidationReport => {
  return validationEngine.validateConsistency();
};

export const validatePosition = (position: CrossPagePosition): PositionValidationResult => {
  return validationEngine.validatePosition(position);
};

export const registerPositions = (pageName: string, positions: CrossPagePosition[]): void => {
  validationEngine.registerPositions(pageName, positions);
};

export const clearValidationData = (): void => {
  validationEngine.clearPositions();
};