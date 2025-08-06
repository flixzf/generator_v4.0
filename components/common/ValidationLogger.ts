/**
 * Validation Logger
 * 
 * This module provides comprehensive error logging for classification failures
 * and validation issues. It captures detailed information about validation
 * problems and provides structured logging for debugging and monitoring.
 */

import { Inconsistency, ValidationReport, AggregationValidationResult } from './ValidationEngine';
import { Position, ValidationResult } from './ClassificationEngine';

export interface LogEntry {
  timestamp: Date;
  level: 'error' | 'warning' | 'info' | 'debug';
  category: 'classification' | 'validation' | 'aggregation' | 'system';
  message: string;
  details?: any;
  context?: {
    position?: Position;
    page?: string;
    department?: string;
    level?: string;
    expectedClassification?: string;
    actualClassification?: string;
  };
  stackTrace?: string;
}

export interface ValidationLoggerConfig {
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  logLevel: 'error' | 'warning' | 'info' | 'debug';
  maxLogEntries: number;
  enableStackTrace: boolean;
}

export class ValidationLogger {
  private logs: LogEntry[] = [];
  private config: ValidationLoggerConfig;

  constructor(config?: Partial<ValidationLoggerConfig>) {
    this.config = {
      enableConsoleLogging: true,
      enableFileLogging: false,
      logLevel: 'warning',
      maxLogEntries: 1000,
      enableStackTrace: false,
      ...config
    };
  }

  /**
   * Log classification failure
   */
  public logClassificationFailure(
    position: Position,
    error: string,
    expectedClassification?: string,
    actualClassification?: string
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level: 'error',
      category: 'classification',
      message: `Classification failure for ${position.department} ${position.level}: ${error}`,
      details: {
        positionId: position.id,
        department: position.department,
        level: position.level,
        title: position.title,
        subtitle: position.subtitle,
        processType: position.processType,
        source: position.source
      },
      context: {
        position,
        department: position.department,
        level: position.level,
        expectedClassification,
        actualClassification
      }
    };

    if (this.config.enableStackTrace) {
      logEntry.stackTrace = new Error().stack;
    }

    this.addLogEntry(logEntry);
  }

  /**
   * Log validation inconsistency
   */
  public logValidationInconsistency(inconsistency: Inconsistency): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level: inconsistency.severity === 'error' ? 'error' : 'warning',
      category: 'validation',
      message: `Validation inconsistency: ${inconsistency.reason}`,
      details: {
        positionId: inconsistency.positionId,
        department: inconsistency.department,
        level: inconsistency.level,
        title: inconsistency.title,
        subtitle: inconsistency.subtitle,
        expectedClassification: inconsistency.expectedClassification,
        actualClassification: inconsistency.actualClassification,
        pages: inconsistency.pages
      },
      context: {
        department: inconsistency.department,
        level: inconsistency.level,
        expectedClassification: inconsistency.expectedClassification,
        actualClassification: inconsistency.actualClassification
      }
    };

    this.addLogEntry(logEntry);
  }

  /**
   * Log aggregation validation failure
   */
  public logAggregationFailure(
    department: string,
    level: string,
    expectedCount: number,
    actualCount: number,
    reason: string
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level: 'error',
      category: 'aggregation',
      message: `Aggregation validation failure: ${reason}`,
      details: {
        department,
        level,
        expectedCount,
        actualCount,
        difference: actualCount - expectedCount
      },
      context: {
        department,
        level
      }
    };

    this.addLogEntry(logEntry);
  }

  /**
   * Log validation report summary
   */
  public logValidationReport(report: ValidationReport): void {
    const level = report.isValid ? 'info' : 'error';
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      category: 'validation',
      message: `Validation report: ${report.isValid ? 'PASSED' : 'FAILED'} - ${report.inconsistencies.length} inconsistencies found`,
      details: {
        isValid: report.isValid,
        totalPositions: report.summary.totalPositions,
        validPositions: report.summary.validPositions,
        inconsistentPositions: report.summary.inconsistentPositions,
        classificationCounts: report.summary.classificationCounts,
        pagesCovered: report.summary.pagesCovered,
        inconsistenciesCount: report.inconsistencies.length
      }
    };

    this.addLogEntry(logEntry);

    // Log each inconsistency
    report.inconsistencies.forEach(inconsistency => {
      this.logValidationInconsistency(inconsistency);
    });
  }

  /**
   * Log aggregation validation report
   */
  public logAggregationReport(report: AggregationValidationResult): void {
    const level = report.isValid ? 'info' : 'error';
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      category: 'aggregation',
      message: `Aggregation validation: ${report.isValid ? 'PASSED' : 'FAILED'} - ${report.mismatches.length} mismatches found`,
      details: {
        isValid: report.isValid,
        directPageTotal: report.directPageTotal,
        indirectPageTotal: report.indirectPageTotal,
        ohPageTotal: report.ohPageTotal,
        detailedViewTotal: report.detailedViewTotal,
        mismatchesCount: report.mismatches.length
      }
    };

    this.addLogEntry(logEntry);

    // Log each mismatch
    report.mismatches.forEach(mismatch => {
      this.logAggregationFailure(
        mismatch.department,
        mismatch.level,
        mismatch.detailedCount,
        mismatch.aggregatedCount,
        mismatch.reason
      );
    });
  }

  /**
   * Log position validation result
   */
  public logPositionValidation(position: Position, result: ValidationResult): void {
    if (!result.isValid) {
      result.errors.forEach(error => {
        this.logClassificationFailure(position, error);
      });
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        const logEntry: LogEntry = {
          timestamp: new Date(),
          level: 'warning',
          category: 'classification',
          message: `Position validation warning: ${warning}`,
          details: {
            positionId: position.id,
            department: position.department,
            level: position.level,
            warning
          },
          context: {
            position,
            department: position.department,
            level: position.level
          }
        };

        this.addLogEntry(logEntry);
      });
    }
  }

  /**
   * Log system error
   */
  public logSystemError(error: Error, context?: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level: 'error',
      category: 'system',
      message: `System error: ${error.message}`,
      details: {
        errorName: error.name,
        errorMessage: error.message,
        context
      },
      stackTrace: error.stack
    };

    this.addLogEntry(logEntry);
  }

  /**
   * Log warning message
   */
  public logWarning(message: string, details?: any, context?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level: 'warning',
      category: 'system',
      message,
      details,
      context
    };

    this.addLogEntry(logEntry);
  }

  /**
   * Log info message
   */
  public logInfo(message: string, details?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level: 'info',
      category: 'system',
      message,
      details
    };

    this.addLogEntry(logEntry);
  }

  /**
   * Log debug message
   */
  public logDebug(message: string, details?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level: 'debug',
      category: 'system',
      message,
      details
    };

    this.addLogEntry(logEntry);
  }

  /**
   * Get all log entries
   */
  public getLogs(
    level?: 'error' | 'warning' | 'info' | 'debug',
    category?: 'classification' | 'validation' | 'aggregation' | 'system',
    limit?: number
  ): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      const levelPriority = { error: 0, warning: 1, info: 2, debug: 3 };
      const targetPriority = levelPriority[level];
      filteredLogs = filteredLogs.filter(log => levelPriority[log.level] <= targetPriority);
    }

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get error summary
   */
  public getErrorSummary(): {
    totalErrors: number;
    totalWarnings: number;
    classificationErrors: number;
    validationErrors: number;
    aggregationErrors: number;
    systemErrors: number;
    recentErrors: LogEntry[];
  } {
    const errors = this.logs.filter(log => log.level === 'error');
    const warnings = this.logs.filter(log => log.level === 'warning');

    return {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      classificationErrors: errors.filter(log => log.category === 'classification').length,
      validationErrors: errors.filter(log => log.category === 'validation').length,
      aggregationErrors: errors.filter(log => log.category === 'aggregation').length,
      systemErrors: errors.filter(log => log.category === 'system').length,
      recentErrors: errors.slice(-10).reverse()
    };
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Update logger configuration
   */
  public updateConfig(newConfig: Partial<ValidationLoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): ValidationLoggerConfig {
    return { ...this.config };
  }

  // Private methods

  private addLogEntry(entry: LogEntry): void {
    // Check if log level is enabled
    const levelPriority = { error: 0, warning: 1, info: 2, debug: 3 };
    if (levelPriority[entry.level] > levelPriority[this.config.logLevel]) {
      return;
    }

    // Add to internal log storage
    this.logs.push(entry);

    // Maintain max log entries limit
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs = this.logs.slice(-this.config.maxLogEntries);
    }

    // Console logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(entry);
    }

    // File logging (if enabled and in appropriate environment)
    if (this.config.enableFileLogging && typeof window === 'undefined') {
      this.logToFile(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'error':
        console.error(message, entry.details);
        if (entry.stackTrace) {
          console.error(entry.stackTrace);
        }
        break;
      case 'warning':
        console.warn(message, entry.details);
        break;
      case 'info':
        console.info(message, entry.details);
        break;
      case 'debug':
        console.debug(message, entry.details);
        break;
    }
  }

  private logToFile(entry: LogEntry): void {
    // File logging implementation would go here
    // This is a placeholder for server-side file logging
    // In a real implementation, you might use fs.appendFile or a logging library
  }
}

// Export singleton instance
export const validationLogger = new ValidationLogger();

// Export utility functions
export const logClassificationFailure = (
  position: Position,
  error: string,
  expectedClassification?: string,
  actualClassification?: string
): void => {
  validationLogger.logClassificationFailure(position, error, expectedClassification, actualClassification);
};

export const logValidationReport = (report: ValidationReport): void => {
  validationLogger.logValidationReport(report);
};

export const logAggregationReport = (report: AggregationValidationResult): void => {
  validationLogger.logAggregationReport(report);
};

export const logSystemError = (error: Error, context?: string): void => {
  validationLogger.logSystemError(error, context);
};

export const getValidationLogs = (
  level?: 'error' | 'warning' | 'info' | 'debug',
  category?: 'classification' | 'validation' | 'aggregation' | 'system',
  limit?: number
): LogEntry[] => {
  return validationLogger.getLogs(level, category, limit);
};

export const getErrorSummary = () => {
  return validationLogger.getErrorSummary();
};