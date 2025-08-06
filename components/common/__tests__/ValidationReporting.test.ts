/**
 * Validation Reporting Tests
 * 
 * Tests for the validation reporting and error handling functionality
 * implemented in task 9.
 */

import { ValidationEngine, CrossPagePosition } from '../ValidationEngine';
import { ClassificationEngine } from '../ClassificationEngine';
import { ValidationLogger } from '../ValidationLogger';

describe('Validation Reporting and Error Handling', () => {
  let classificationEngine: ClassificationEngine;
  let validationEngine: ValidationEngine;
  let logger: ValidationLogger;

  beforeEach(() => {
    classificationEngine = new ClassificationEngine();
    logger = new ValidationLogger();
    validationEngine = new ValidationEngine(classificationEngine, logger);
    validationEngine.clearPositions();
    logger.clearLogs();
  });

  describe('Error Logging', () => {
    test('should log classification failures', () => {
      const position = {
        id: 'test-pos',
        department: 'Line',
        level: 'PM' as const,
        title: 'Line PM',
        source: 'page1'
      };

      logger.logClassificationFailure(position, 'Test error', 'OH', 'direct');
      
      const logs = logger.getLogs('error', 'classification');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Classification failure');
      expect(logs[0].details.department).toBe('Line');
    });

    test('should log validation inconsistencies', () => {
      const inconsistency = {
        positionId: 'test-pos',
        department: 'Line',
        level: 'PM',
        expectedClassification: 'OH' as const,
        actualClassification: 'direct' as const,
        pages: ['page1', 'page2'],
        reason: 'Test inconsistency',
        severity: 'error' as const
      };

      logger.logValidationInconsistency(inconsistency);
      
      const logs = logger.getLogs('error', 'validation');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Validation inconsistency');
    });

    test('should log aggregation failures', () => {
      logger.logAggregationFailure('Line', 'PM', 5, 3, 'Count mismatch');
      
      const logs = logger.getLogs('error', 'aggregation');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Aggregation validation failure');
      expect(logs[0].details.expectedCount).toBe(5);
      expect(logs[0].details.actualCount).toBe(3);
    });

    test('should provide error summary', () => {
      // Add some test errors
      logger.logClassificationFailure({
        id: 'test1',
        department: 'Line',
        level: 'PM',
        title: 'Test',
        source: 'page1'
      }, 'Error 1');

      logger.logAggregationFailure('Quality', 'GL', 2, 1, 'Error 2');
      logger.logWarning('Test warning');

      const summary = logger.getErrorSummary();
      expect(summary.totalErrors).toBe(2);
      expect(summary.totalWarnings).toBe(1);
      expect(summary.classificationErrors).toBe(1);
      expect(summary.aggregationErrors).toBe(1);
    });
  });

  describe('Graceful Error Handling', () => {
    test('should handle null position gracefully', () => {
      const result = classificationEngine.classifyPositionWithRecovery({
        id: 'test',
        department: '',
        level: 'TM',
        title: '',
        source: 'page1'
      });

      expect(result.classification).toBeDefined();
      expect(result.usedFallback).toBe(true);
      expect(result.confidence).toBe('low');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should provide fallback classification for unknown departments', () => {
      const result = classificationEngine.classifyPositionWithRecovery({
        id: 'test',
        department: 'Unknown Department',
        level: 'TM',
        title: 'Test Position',
        source: 'page1'
      });

      expect(result.classification).toBeDefined();
      expect(['direct', 'indirect', 'OH']).toContain(result.classification);
      expect(result.usedFallback).toBe(true);
    });

    test('should handle batch classification with errors', () => {
      const positions = [
        {
          id: 'valid',
          department: 'Line',
          level: 'PM' as const,
          title: 'Valid Position',
          source: 'page1' as const
        },
        {
          id: 'invalid',
          department: '',
          level: 'TM' as const,
          title: 'Invalid Position',
          source: 'page1' as const
        }
      ];

      const result = classificationEngine.batchClassifyPositions(positions);
      
      expect(result.results).toHaveLength(2);
      expect(result.summary.total).toBe(2);
      expect(result.summary.withFallback).toBeGreaterThan(0);
      
      // Valid position should work normally
      const validResult = result.results.find(r => r.position.id === 'valid');
      expect(validResult?.classification).toBe('OH');
      expect(validResult?.usedFallback).toBe(false);
      
      // Invalid position should use fallback
      const invalidResult = result.results.find(r => r.position.id === 'invalid');
      expect(invalidResult?.usedFallback).toBe(true);
      expect(invalidResult?.confidence).toBe('low');
    });

    test('should handle validation engine errors gracefully', () => {
      // Test with malformed position data
      const positions: CrossPagePosition[] = [
        {
          id: '',
          department: '',
          level: 'TM',
          source: 'test'
        }
      ];

      validationEngine.registerPositions('test', positions);
      
      // Should not throw error
      expect(() => {
        const report = validationEngine.validateConsistency();
        expect(report).toBeDefined();
      }).not.toThrow();
    });

    test('should handle aggregation validation errors gracefully', () => {
      const positions: CrossPagePosition[] = [
        {
          id: 'test',
          department: 'Line',
          level: 'PM',
          source: 'page1'
        }
      ];

      // Should not throw error even with null inputs
      expect(() => {
        const result = validationEngine.validateAggregation(
          positions,
          [],
          positions
        );
        expect(result).toBeDefined();
        expect(result.isValid).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Validation Engine with Logging Integration', () => {
    test('should log validation reports automatically', () => {
      const positions: CrossPagePosition[] = [
        {
          id: 'line-pm',
          department: 'Line',
          level: 'PM',
          title: 'Line PM',
          source: 'page1'
        }
      ];

      validationEngine.registerPositions('page1', positions);
      const report = validationEngine.validateConsistency();

      // Check that validation was logged
      const logs = logger.getLogs('info', 'validation');
      expect(logs.length).toBeGreaterThan(0);
      
      const validationLog = logs.find(log => log.message.includes('Validation report'));
      expect(validationLog).toBeDefined();
      expect(validationLog?.details.totalPositions).toBe(1);
    });

    test('should log aggregation reports automatically', () => {
      const directPositions: CrossPagePosition[] = [
        {
          id: 'ce-mixing',
          department: 'CE',
          level: 'TM',
          subtitle: 'Mixing',
          source: 'page4-direct'
        }
      ];

      const indirectPositions: CrossPagePosition[] = [
        {
          id: 'line-pm',
          department: 'Line',
          level: 'PM',
          source: 'page4-indirect'
        }
      ];

      const detailedPositions = [...directPositions, ...indirectPositions];

      const result = validationEngine.validateAggregation(
        directPositions,
        indirectPositions,
        detailedPositions
      );

      // Check that aggregation validation was logged
      const logs = logger.getLogs('info', 'aggregation');
      expect(logs.length).toBeGreaterThan(0);
      
      const aggregationLog = logs.find(log => log.message.includes('Aggregation validation'));
      expect(aggregationLog).toBeDefined();
    });

    test('should handle position validation with logging', () => {
      const position: CrossPagePosition = {
        id: 'test-pos',
        department: 'Line',
        level: 'PM',
        title: 'Line PM',
        source: 'page1'
      };

      const result = validationEngine.validatePosition(position);
      
      expect(result.isValid).toBe(true);
      expect(result.expectedClassification).toBe('OH');
      
      // Should not generate error logs for valid position
      const errorLogs = logger.getLogs('error');
      expect(errorLogs).toHaveLength(0);
    });

    test('should log position validation issues', () => {
      const invalidPosition: CrossPagePosition = {
        id: 'invalid',
        department: '', // Missing department
        level: 'TM',
        source: 'page1'
      };

      const result = validationEngine.validatePosition(invalidPosition);
      
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      
      // Should generate logs for invalid position
      const logs = logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('Logger Configuration', () => {
    test('should respect log level configuration', () => {
      const customLogger = new ValidationLogger({
        logLevel: 'error'
      });

      customLogger.logWarning('This should be ignored');
      customLogger.logError('This should be logged', new Error('Test error'));

      const logs = customLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
    });

    test('should limit log entries based on configuration', () => {
      const customLogger = new ValidationLogger({
        maxLogEntries: 2
      });

      customLogger.logInfo('Log 1');
      customLogger.logInfo('Log 2');
      customLogger.logInfo('Log 3'); // Should push out Log 1

      const logs = customLogger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs.some(log => log.message === 'Log 1')).toBe(false);
      expect(logs.some(log => log.message === 'Log 3')).toBe(true);
    });

    test('should export logs as JSON', () => {
      logger.logInfo('Test log for export');
      
      const exportedLogs = logger.exportLogs();
      expect(exportedLogs).toBeDefined();
      
      const parsedLogs = JSON.parse(exportedLogs);
      expect(Array.isArray(parsedLogs)).toBe(true);
      expect(parsedLogs.length).toBeGreaterThan(0);
    });
  });
});