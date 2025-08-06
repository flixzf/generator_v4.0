'use client';

/**
 * Validation Hook
 * 
 * This hook provides easy access to validation functionality and state management
 * for the validation reporting system.
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  ValidationReport, 
  AggregationValidationResult,
  CrossPagePosition,
  validationEngine,
  ValidationEngine
} from './ValidationEngine';
import { validationLogger, getErrorSummary } from './ValidationLogger';

export interface UseValidationOptions {
  autoValidate?: boolean;
  validationEngine?: ValidationEngine;
}

export interface ValidationState {
  report: ValidationReport | null;
  aggregationReport: AggregationValidationResult | null;
  isValidating: boolean;
  lastValidated: Date | null;
  errorSummary: ReturnType<typeof getErrorSummary>;
}

export const useValidation = (options: UseValidationOptions = {}) => {
  const { autoValidate = false, validationEngine: customEngine } = options;
  const engine = customEngine || validationEngine;

  const [state, setState] = useState<ValidationState>({
    report: null,
    aggregationReport: null,
    isValidating: false,
    lastValidated: null,
    errorSummary: getErrorSummary()
  });

  /**
   * Run validation consistency check
   */
  const validateConsistency = useCallback(async (): Promise<ValidationReport> => {
    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const report = engine.validateConsistency();
      setState(prev => ({
        ...prev,
        report,
        lastValidated: new Date(),
        errorSummary: getErrorSummary()
      }));
      return report;
    } catch (error) {
      validationLogger.logSystemError(
        error instanceof Error ? error : new Error('Unknown validation error'),
        'useValidation.validateConsistency'
      );
      throw error;
    } finally {
      setState(prev => ({ ...prev, isValidating: false }));
    }
  }, [engine]);

  /**
   * Run aggregation validation
   */
  const validateAggregation = useCallback(async (
    directPagePositions: CrossPagePosition[],
    indirectPagePositions: CrossPagePosition[],
    detailedPositions: CrossPagePosition[]
  ): Promise<AggregationValidationResult> => {
    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const aggregationReport = engine.validateAggregation(
        directPagePositions,
        indirectPagePositions,
        detailedPositions
      );
      setState(prev => ({
        ...prev,
        aggregationReport,
        lastValidated: new Date(),
        errorSummary: getErrorSummary()
      }));
      return aggregationReport;
    } catch (error) {
      validationLogger.logSystemError(
        error instanceof Error ? error : new Error('Unknown aggregation validation error'),
        'useValidation.validateAggregation'
      );
      throw error;
    } finally {
      setState(prev => ({ ...prev, isValidating: false }));
    }
  }, [engine]);

  /**
   * Register positions for validation
   */
  const registerPositions = useCallback((pageName: string, positions: CrossPagePosition[]) => {
    try {
      engine.registerPositions(pageName, positions);
      
      // Auto-validate if enabled
      if (autoValidate) {
        validateConsistency();
      }
    } catch (error) {
      validationLogger.logSystemError(
        error instanceof Error ? error : new Error('Unknown error registering positions'),
        `useValidation.registerPositions - ${pageName}`
      );
    }
  }, [engine, autoValidate, validateConsistency]);

  /**
   * Clear all validation data
   */
  const clearValidation = useCallback(() => {
    try {
      engine.clearPositions();
      validationLogger.clearLogs();
      setState({
        report: null,
        aggregationReport: null,
        isValidating: false,
        lastValidated: null,
        errorSummary: getErrorSummary()
      });
    } catch (error) {
      validationLogger.logSystemError(
        error instanceof Error ? error : new Error('Unknown error clearing validation'),
        'useValidation.clearValidation'
      );
    }
  }, [engine]);

  /**
   * Get validation logs
   */
  const getValidationLogs = useCallback((
    level?: 'error' | 'warning' | 'info' | 'debug',
    category?: 'classification' | 'validation' | 'aggregation' | 'system',
    limit?: number
  ) => {
    return validationLogger.getLogs(level, category, limit);
  }, []);

  /**
   * Refresh error summary
   */
  const refreshErrorSummary = useCallback(() => {
    setState(prev => ({
      ...prev,
      errorSummary: getErrorSummary()
    }));
  }, []);

  /**
   * Run complete validation (consistency + aggregation if data available)
   */
  const runCompleteValidation = useCallback(async (
    directPagePositions?: CrossPagePosition[],
    indirectPagePositions?: CrossPagePosition[],
    detailedPositions?: CrossPagePosition[]
  ) => {
    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      // Always run consistency validation
      const consistencyReport = await validateConsistency();
      
      // Run aggregation validation if data is provided
      let aggregationReport: AggregationValidationResult | null = null;
      if (directPagePositions && indirectPagePositions && detailedPositions) {
        aggregationReport = await validateAggregation(
          directPagePositions,
          indirectPagePositions,
          detailedPositions
        );
      }

      return {
        consistencyReport,
        aggregationReport
      };
    } finally {
      setState(prev => ({ ...prev, isValidating: false }));
    }
  }, [validateConsistency, validateAggregation]);

  // Auto-validate on mount if enabled
  useEffect(() => {
    if (autoValidate) {
      validateConsistency().catch(error => {
        console.error('Auto-validation failed:', error);
      });
    }
  }, [autoValidate, validateConsistency]);

  return {
    // State
    ...state,
    
    // Actions
    validateConsistency,
    validateAggregation,
    registerPositions,
    clearValidation,
    runCompleteValidation,
    
    // Utilities
    getValidationLogs,
    refreshErrorSummary,
    
    // Computed values
    hasErrors: state.errorSummary.totalErrors > 0,
    hasWarnings: state.errorSummary.totalWarnings > 0,
    isHealthy: state.report?.isValid === true && state.aggregationReport?.isValid !== false,
  };
};

export default useValidation;