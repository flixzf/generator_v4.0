/**
 * Centralized Classification Engine
 * 
 * This module provides consistent personnel classification logic across all pages
 * of the organization chart application. It ensures that Direct, Indirect, and OH
 * classifications are applied uniformly based on department, level, and process rules.
 */

// Core interfaces for the classification system
export interface Position {
  id: string;
  department: string;
  level: 'PM' | 'LM' | 'GL' | 'TL' | 'TM' | 'DEPT';
  title: string;
  subtitle?: string;
  processType?: string;
  lineIndex?: number;
  classification?: 'direct' | 'indirect' | 'OH';
  source: 'page1' | 'page2' | 'page3' | 'separated';
  metadata?: {
    manpower?: number;
    responsibilities?: string[];
    processName?: string;
  };
}

export interface ClassificationRule {
  defaultClassification: 'direct' | 'indirect' | 'OH';
  conditions?: ClassificationCondition[];
}

export interface ClassificationCondition {
  field: 'level' | 'processType' | 'subtitle' | 'title';
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith';
  value: string;
  classification: 'direct' | 'indirect' | 'OH';
}

export interface ExceptionRule {
  condition: (position: Position) => boolean;
  classification: 'direct' | 'indirect' | 'OH';
  reason: string;
  priority: number; // Higher number = higher priority
}

export interface ClassificationRules {
  departmentRules: Record<string, ClassificationRule>;
  levelRules: Record<string, ClassificationRule>;
  processRules: Record<string, ClassificationRule>;
  exceptionRules: ExceptionRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Classification Engine implementation
export class ClassificationEngine {
  private rules: ClassificationRules;

  constructor() {
    this.rules = this.initializeRules();
  }

  /**
   * Initialize classification rules based on requirements
   */
  private initializeRules(): ClassificationRules {
    return {
      // Department-based classification rules
      departmentRules: {
        // Production departments
        'Line': {
          defaultClassification: 'indirect',
          conditions: [
            {
              field: 'level',
              operator: 'equals',
              value: 'PM',
              classification: 'OH'
            },
            {
              field: 'level',
              operator: 'equals',
              value: 'LM',
              classification: 'OH'
            }
          ]
        },
        'Quality': {
          defaultClassification: 'indirect',
          conditions: [
            {
              field: 'level',
              operator: 'equals',
              value: 'GL',
              classification: 'OH'
            }
          ]
        },
        'CE': {
          defaultClassification: 'OH'
        },

        // Administrative departments
        'Admin': {
          defaultClassification: 'OH'
        },
        'Small Tooling': {
          defaultClassification: 'OH'
        },

        // Material handling departments
        'Raw Material': {
          defaultClassification: 'indirect'
        },
        'Sub Material': {
          defaultClassification: 'OH'
        },

        // Market departments
        'ACC Market': {
          defaultClassification: 'indirect'
        },
        'P&L Market': {
          defaultClassification: 'indirect'
        },
        'Bottom Market': {
          defaultClassification: 'indirect'
        },

        // Warehouse departments
        'FG WH': {
          defaultClassification: 'indirect'
        },

        // Plant production (for separated processes)
        'Plant Production': {
          defaultClassification: 'indirect',
          conditions: [
            {
              field: 'level',
              operator: 'equals',
              value: 'TM',
              classification: 'direct'
            }
          ]
        },

        // Support departments
        'TPM': {
          defaultClassification: 'OH'
        },
        'CQM': {
          defaultClassification: 'OH'
        },
        'Lean': {
          defaultClassification: 'OH'
        },
        'Security': {
          defaultClassification: 'OH'
        },
        'RMCC': {
          defaultClassification: 'OH'
        },

        // Separated process departments
        'No-sew': {
          defaultClassification: 'indirect'
        },
        'HF Welding': {
          defaultClassification: 'indirect'
        },
        'Separated': {
          defaultClassification: 'indirect' // For blank positions
        }
      },

      // Level-based override rules (highest priority)
      levelRules: {
        'PM': {
          defaultClassification: 'OH'
        },
        'LM': {
          defaultClassification: 'OH'
        }
      },

      // Process-specific rules
      processRules: {
        'No-sew': {
          defaultClassification: 'indirect'
        },
        'HF Welding': {
          defaultClassification: 'indirect'
        }
      },

      // Exception rules for special cases (highest priority)
      exceptionRules: [
        // CE TM Mixing exception - should be direct
        {
          condition: (pos) => pos.department === 'CE' && pos.level === 'TM' &&
            (pos.subtitle?.includes('Mixing') || pos.title.includes('Mixing')),
          classification: 'direct',
          reason: 'CE TM Mixing is classified as direct production work',
          priority: 10
        },

        // FG WH TM Shipping exception - should be OH
        {
          condition: (pos) => pos.department === 'FG WH' &&
            pos.level === 'TM' &&
            (pos.subtitle?.includes('Shipping') || pos.title.includes('Shipping')),
          classification: 'OH',
          reason: 'FG WH TM Shipping is classified as overhead',
          priority: 10
        },

        // All separated process positions (No-sew, HF Welding) should be indirect
        {
          condition: (pos) => pos.processType === 'No-sew',
          classification: 'indirect',
          reason: 'No-sew process positions are indirect production work',
          priority: 8
        },
        {
          condition: (pos) => pos.processType === 'HF Welding',
          classification: 'indirect',
          reason: 'HF Welding process positions are indirect production work',
          priority: 8
        },

        // Department name variations handling
        {
          condition: (pos) => pos.department === 'No-sew',
          classification: 'indirect',
          reason: 'No-sew department positions are indirect production',
          priority: 7
        },
        {
          condition: (pos) => pos.department === 'HF Welding',
          classification: 'indirect',
          reason: 'HF Welding department positions are indirect production',
          priority: 7
        },

        // Additional patterns for no-sew and HF welding in subtitle/title
        {
          condition: (pos) => pos.subtitle?.toLowerCase().includes('no-sew') || pos.title?.toLowerCase().includes('no-sew'),
          classification: 'indirect',
          reason: 'Positions with no-sew in title/subtitle are indirect',
          priority: 7
        },
        {
          condition: (pos) => pos.subtitle?.toLowerCase().includes('hf welding') || pos.title?.toLowerCase().includes('hf welding'),
          classification: 'indirect',
          reason: 'Positions with HF welding in title/subtitle are indirect',
          priority: 7
        },

        // Blank/separated positions
        {
          condition: (pos) => pos.department === 'Separated' && pos.level !== 'DEPT',
          classification: 'indirect',
          reason: 'Separated department positions are typically blank/indirect',
          priority: 6
        }
      ]
    };
  }

  /**
   * Classify a position based on department, level, and process rules
   */
  public classifyPosition(
    department: string,
    level: 'PM' | 'LM' | 'GL' | 'TL' | 'TM' | 'DEPT',
    processType?: string,
    subtitle?: string,
    title?: string
  ): 'direct' | 'indirect' | 'OH' {
    try {
      const position: Position = {
        id: `${department}-${level}`,
        department,
        level,
        title: title || '',
        subtitle,
        processType,
        source: 'page1' // Default source
      };

      return this.classifyPositionObject(position);
    } catch (error) {
      // Log error and return fallback classification
      console.error(`Classification error for ${department} ${level}:`, error);
      return this.getFallbackClassification(department, level, processType, subtitle, title);
    }
  }

  /**
   * Classify a position object
   */
  public classifyPositionObject(position: Position): 'direct' | 'indirect' | 'OH' {
    try {
      // Input validation with graceful handling
      if (!position) {
        console.error('Position object is null or undefined');
        return this.getFallbackClassification();
      }

      if (!position.department || !position.level) {
        console.error('Position missing required fields:', { department: position.department, level: position.level });
        return this.getFallbackClassification(position.department, position.level);
      }

      // Normalize department name first
      const normalizedPosition = {
        ...position,
        department: normalizeDepartmentName(position.department)
      };

      // 1. Check exception rules first (highest priority)
      try {
        const applicableExceptions = this.rules.exceptionRules
          .filter(rule => {
            try {
              return rule.condition(normalizedPosition);
            } catch (error) {
              console.warn(`Exception rule evaluation failed:`, error);
              return false;
            }
          })
          .sort((a, b) => b.priority - a.priority);

        if (applicableExceptions.length > 0) {
          return applicableExceptions[0].classification;
        }
      } catch (error) {
        console.warn('Error evaluating exception rules:', error);
      }

      // 2. Check level-based overrides (PM/LM always OH)
      try {
        const levelRule = this.rules.levelRules[normalizedPosition.level];
        if (levelRule) {
          return levelRule.defaultClassification;
        }
      } catch (error) {
        console.warn('Error evaluating level rules:', error);
      }

      // 3. Check process-specific rules
      try {
        if (normalizedPosition.processType) {
          const processRule = this.rules.processRules[normalizedPosition.processType];
          if (processRule) {
            return processRule.defaultClassification;
          }
        }
      } catch (error) {
        console.warn('Error evaluating process rules:', error);
      }

      // 4. Check department rules with conditions
      try {
        const departmentRule = this.rules.departmentRules[normalizedPosition.department];
        if (departmentRule) {
          // Check if any conditions apply
          if (departmentRule.conditions) {
            for (const condition of departmentRule.conditions) {
              try {
                if (this.evaluateCondition(normalizedPosition, condition)) {
                  return condition.classification;
                }
              } catch (error) {
                console.warn('Error evaluating department condition:', error);
              }
            }
          }

          // Return default department classification
          return departmentRule.defaultClassification;
        }
      } catch (error) {
        console.warn('Error evaluating department rules:', error);
      }

      // 5. Fallback to indirect if no rules match
      console.warn(`No classification rule found for department: ${normalizedPosition.department}, level: ${normalizedPosition.level}`);
      return this.getFallbackClassification(normalizedPosition.department, normalizedPosition.level);

    } catch (error) {
      console.error('Critical error in classifyPositionObject:', error);
      return this.getFallbackClassification(position?.department, position?.level);
    }
  }

  /**
   * Evaluate a classification condition
   */
  private evaluateCondition(position: Position, condition: ClassificationCondition): boolean {
    const fieldValue = this.getFieldValue(position, condition.field);
    if (!fieldValue) return false;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'contains':
        return fieldValue.includes(condition.value);
      case 'startsWith':
        return fieldValue.startsWith(condition.value);
      case 'endsWith':
        return fieldValue.endsWith(condition.value);
      default:
        return false;
    }
  }

  /**
   * Get field value from position object
   */
  private getFieldValue(position: Position, field: string): string {
    switch (field) {
      case 'level':
        return position.level;
      case 'processType':
        return position.processType || '';
      case 'subtitle':
        return position.subtitle || '';
      case 'title':
        return position.title || '';
      default:
        return '';
    }
  }

  /**
   * Validate a position classification
   */
  public validateClassification(position: Position): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!position.department) {
      errors.push('Position department is required');
    }
    if (!position.level) {
      errors.push('Position level is required');
    }

    // Validate classification consistency
    const expectedClassification = this.classifyPositionObject(position);
    if (position.classification && position.classification !== expectedClassification) {
      warnings.push(
        `Position classification mismatch: expected ${expectedClassification}, got ${position.classification}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get classification rules (for debugging/inspection)
   */
  public getClassificationRules(): ClassificationRules {
    return { ...this.rules };
  }

  /**
   * Update classification rules (for testing or configuration)
   */
  public updateRules(newRules: Partial<ClassificationRules>): void {
    this.rules = {
      departmentRules: { ...this.rules.departmentRules, ...(newRules.departmentRules || {}) },
      levelRules: { ...this.rules.levelRules, ...(newRules.levelRules || {}) },
      processRules: { ...this.rules.processRules, ...(newRules.processRules || {}) },
      exceptionRules: newRules.exceptionRules || this.rules.exceptionRules
    };
  }

  /**
   * Get fallback classification when normal classification fails
   */
  private getFallbackClassification(
    department?: string,
    level?: 'PM' | 'LM' | 'GL' | 'TL' | 'TM' | 'DEPT',
    processType?: string,
    subtitle?: string,
    title?: string
  ): 'direct' | 'indirect' | 'OH' {
    try {
      // Level-based fallback (most reliable)
      if (level) {
        if (level === 'PM' || level === 'LM') {
          return 'OH';
        }
      }

      // Department-based fallback patterns
      if (department) {
        const normalizedDept = normalizeDepartmentName(department);
        
        // Administrative departments are typically OH
        const adminDepartments = ['Admin', 'TPM', 'CQM', 'Lean', 'Security', 'RMCC', 'Small Tooling'];
        if (adminDepartments.includes(normalizedDept)) {
          return 'OH';
        }

        // Production-related departments
        if (normalizedDept.includes('Production') || normalizedDept === 'Plant Production') {
          return level === 'TM' ? 'direct' : 'indirect';
        }

        // Quality departments
        if (normalizedDept.includes('Quality')) {
          return level === 'GL' ? 'OH' : 'indirect';
        }

        // CE department
        if (normalizedDept === 'CE') {
          // Check for mixing in subtitle or title
          if (subtitle?.toLowerCase().includes('mixing') || title?.toLowerCase().includes('mixing')) {
            return 'direct';
          }
          return 'OH';
        }

        // Market departments are typically indirect
        if (normalizedDept.includes('Market')) {
          return 'indirect';
        }

        // Material departments
        if (normalizedDept.includes('Material')) {
          return normalizedDept === 'Sub Material' ? 'OH' : 'indirect';
        }

        // Separated processes
        if (normalizedDept === 'No-sew' || normalizedDept === 'HF Welding' || normalizedDept === 'Separated') {
          return 'indirect';
        }
      }

      // Process-based fallback
      if (processType) {
        if (processType === 'No-sew' || processType === 'HF Welding') {
          return 'indirect';
        }
      }

      // Ultimate fallback based on level hierarchy
      if (level) {
        switch (level) {
          case 'GL':
            return 'indirect'; // Most GLs are indirect unless specific exceptions
          case 'TL':
          case 'TM':
            return 'indirect'; // Conservative fallback
          case 'DEPT':
            return 'OH'; // Department level positions are typically overhead
          default:
            return 'indirect';
        }
      }

      // Final fallback
      return 'indirect';

    } catch (error) {
      console.error('Error in fallback classification:', error);
      return 'indirect'; // Most conservative fallback
    }
  }

  /**
   * Validate classification with error recovery
   */
  public classifyPositionWithRecovery(position: Position): {
    classification: 'direct' | 'indirect' | 'OH';
    confidence: 'high' | 'medium' | 'low';
    warnings: string[];
    usedFallback: boolean;
  } {
    const warnings: string[] = [];
    let usedFallback = false;
    let confidence: 'high' | 'medium' | 'low' = 'high';

    try {
      // Validate input
      if (!position.department) {
        warnings.push('Missing department information');
        confidence = 'low';
      }
      if (!position.level) {
        warnings.push('Missing level information');
        confidence = 'low';
      }

      // Try normal classification first
      const classification = this.classifyPositionObject(position);
      
      // Check if we had to use fallback logic
      const normalizedDept = normalizeDepartmentName(position.department);
      if (!this.rules.departmentRules[normalizedDept] && !this.rules.levelRules[position.level]) {
        warnings.push(`No specific rules found for department: ${normalizedDept}`);
        confidence = confidence === 'high' ? 'medium' : 'low';
        usedFallback = true;
      }

      return {
        classification,
        confidence,
        warnings,
        usedFallback
      };

    } catch (error) {
      warnings.push(`Classification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const fallbackClassification = this.getFallbackClassification(
        position.department,
        position.level,
        position.processType,
        position.subtitle,
        position.title
      );

      return {
        classification: fallbackClassification,
        confidence: 'low',
        warnings,
        usedFallback: true
      };
    }
  }

  /**
   * Batch classify positions with error handling
   */
  public batchClassifyPositions(positions: Position[]): {
    results: Array<{
      position: Position;
      classification: 'direct' | 'indirect' | 'OH';
      confidence: 'high' | 'medium' | 'low';
      warnings: string[];
      usedFallback: boolean;
    }>;
    summary: {
      total: number;
      successful: number;
      withWarnings: number;
      withFallback: number;
      errors: string[];
    };
  } {
    const results: Array<{
      position: Position;
      classification: 'direct' | 'indirect' | 'OH';
      confidence: 'high' | 'medium' | 'low';
      warnings: string[];
      usedFallback: boolean;
    }> = [];

    const errors: string[] = [];
    let successful = 0;
    let withWarnings = 0;
    let withFallback = 0;

    for (const position of positions) {
      try {
        const result = this.classifyPositionWithRecovery(position);
        results.push({
          position,
          ...result
        });

        if (result.warnings.length === 0) {
          successful++;
        } else {
          withWarnings++;
        }

        if (result.usedFallback) {
          withFallback++;
        }

      } catch (error) {
        const errorMessage = `Failed to classify position ${position.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);
        
        // Still try to provide a fallback result
        const fallbackClassification = this.getFallbackClassification(
          position.department,
          position.level,
          position.processType,
          position.subtitle,
          position.title
        );

        results.push({
          position,
          classification: fallbackClassification,
          confidence: 'low',
          warnings: [errorMessage],
          usedFallback: true
        });

        withFallback++;
      }
    }

    return {
      results,
      summary: {
        total: positions.length,
        successful,
        withWarnings,
        withFallback,
        errors
      }
    };
  }
}

// Export singleton instance
export const classificationEngine = new ClassificationEngine();

/**
 * Normalize department names to handle legacy naming inconsistencies and line breaks
 */
export const normalizeDepartmentName = (department: string): string => {
  if (!department) return department;
  
  // First, handle line breaks and extract the main department name
  // For cases like "Plant Production\n(Outsole degreasing)", extract "Plant Production"
  const mainDepartmentName = department.split('\n')[0].trim();
  
  const normalizations: Record<string, string> = {
    'RawMaterial': 'Raw Material',
    'SubMaterial': 'Sub Material',
    'BottomMarket': 'Bottom Market',
    'FGWH': 'FG WH',
    'ACC': 'ACC Market',
    'PL': 'P&L Market'
  };

  return normalizations[mainDepartmentName] || mainDepartmentName;
};

// Export utility functions
export const classifyPosition = (
  department: string,
  level: 'PM' | 'LM' | 'GL' | 'TL' | 'TM' | 'DEPT',
  processType?: string,
  subtitle?: string,
  title?: string
): 'direct' | 'indirect' | 'OH' => {
  const normalizedDepartment = normalizeDepartmentName(department);
  return classificationEngine.classifyPosition(normalizedDepartment, level, processType, subtitle, title);
};

export const validatePosition = (position: Position): ValidationResult => {
  const normalizedPosition = {
    ...position,
    department: normalizeDepartmentName(position.department)
  };
  return classificationEngine.validateClassification(normalizedPosition);
};