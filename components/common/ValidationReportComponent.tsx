'use client';

/**
 * Validation Report Component
 * 
 * This component displays classification inconsistencies and validation results
 * in a user-friendly format. It provides detailed information about validation
 * errors, warnings, and inconsistencies across the organization chart application.
 */

import React, { useState, useEffect } from 'react';
import { 
  ValidationReport, 
  Inconsistency, 
  AggregationValidationResult,
  ValidationEngine,
  validationEngine 
} from './ValidationEngine';

interface ValidationReportProps {
  report?: ValidationReport;
  aggregationReport?: AggregationValidationResult;
  onRefresh?: () => void;
  showDetailedAnalysis?: boolean;
  className?: string;
}

export const ValidationReportComponent: React.FC<ValidationReportProps> = ({
  report,
  aggregationReport,
  onRefresh,
  showDetailedAnalysis = false,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [currentReport, setCurrentReport] = useState<ValidationReport | null>(report || null);

  useEffect(() => {
    if (report) {
      setCurrentReport(report);
    }
  }, [report]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getSeverityColor = (severity: 'error' | 'warning') => {
    return severity === 'error' ? 'text-red-600 bg-red-50' : 'text-yellow-600 bg-yellow-50';
  };

  const getValidationStatusColor = (isValid: boolean) => {
    return isValid ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString();
  };

  if (!currentReport && !aggregationReport) {
    return (
      <div className={`p-4 border rounded-lg bg-gray-50 ${className}`}>
        <div className="text-center text-gray-500">
          <p>No validation data available</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Run Validation
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Validation Summary */}
      {currentReport && (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Validation Summary</h3>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentReport.summary.totalPositions}
              </div>
              <div className="text-sm text-gray-600">Total Positions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentReport.summary.validPositions}
              </div>
              <div className="text-sm text-gray-600">Valid Positions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {currentReport.summary.inconsistentPositions}
              </div>
              <div className="text-sm text-gray-600">Inconsistencies</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getValidationStatusColor(currentReport.isValid).split(' ')[0]}`}>
                {currentReport.isValid ? 'PASS' : 'FAIL'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>

          {/* Classification Distribution */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Classification Distribution</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-lg font-semibold text-blue-600">
                  {currentReport.summary.classificationCounts.direct}
                </div>
                <div className="text-sm text-gray-600">Direct</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-lg font-semibold text-green-600">
                  {currentReport.summary.classificationCounts.indirect}
                </div>
                <div className="text-sm text-gray-600">Indirect</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-lg font-semibold text-purple-600">
                  {currentReport.summary.classificationCounts.OH}
                </div>
                <div className="text-sm text-gray-600">OH</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Last updated: {formatTimestamp(currentReport.timestamp)}
          </div>
        </div>
      )}

      {/* Inconsistencies Section */}
      {currentReport && currentReport.inconsistencies.length > 0 && (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <button
            onClick={() => toggleSection('inconsistencies')}
            className="flex justify-between items-center w-full text-left"
          >
            <h3 className="text-lg font-semibold text-red-600">
              Classification Inconsistencies ({currentReport.inconsistencies.length})
            </h3>
            <span className="text-gray-400">
              {expandedSections.has('inconsistencies') ? '▼' : '▶'}
            </span>
          </button>

          {expandedSections.has('inconsistencies') && (
            <div className="mt-4 space-y-3">
              {currentReport.inconsistencies.map((inconsistency, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border-l-4 ${getSeverityColor(inconsistency.severity)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">
                      {inconsistency.department} - {inconsistency.level}
                      {inconsistency.title && ` (${inconsistency.title})`}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(inconsistency.severity)}`}>
                      {inconsistency.severity.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Expected:</span> {inconsistency.expectedClassification}
                    </div>
                    <div>
                      <span className="font-medium">Actual:</span> {inconsistency.actualClassification}
                    </div>
                    <div>
                      <span className="font-medium">Pages:</span> {inconsistency.pages.join(', ')}
                    </div>
                    <div className="text-gray-600">
                      <span className="font-medium">Reason:</span> {inconsistency.reason}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aggregation Validation Results */}
      {aggregationReport && (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <button
            onClick={() => toggleSection('aggregation')}
            className="flex justify-between items-center w-full text-left"
          >
            <h3 className="text-lg font-semibold">
              Aggregation Validation
              <span className={`ml-2 px-2 py-1 text-xs rounded ${getValidationStatusColor(aggregationReport.isValid)}`}>
                {aggregationReport.isValid ? 'PASS' : 'FAIL'}
              </span>
            </h3>
            <span className="text-gray-400">
              {expandedSections.has('aggregation') ? '▼' : '▶'}
            </span>
          </button>

          {expandedSections.has('aggregation') && (
            <div className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="text-lg font-semibold text-blue-600">
                    {aggregationReport.directPageTotal}
                  </div>
                  <div className="text-sm text-gray-600">Direct Page</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="text-lg font-semibold text-green-600">
                    {aggregationReport.indirectPageTotal}
                  </div>
                  <div className="text-sm text-gray-600">Indirect Page</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <div className="text-lg font-semibold text-purple-600">
                    {aggregationReport.ohPageTotal}
                  </div>
                  <div className="text-sm text-gray-600">OH Page</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-gray-600">
                    {aggregationReport.detailedViewTotal}
                  </div>
                  <div className="text-sm text-gray-600">Detailed Total</div>
                </div>
              </div>

              {aggregationReport.mismatches.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Aggregation Mismatches</h4>
                  {aggregationReport.mismatches.map((mismatch, index) => (
                    <div key={index} className="p-2 bg-red-50 border-l-4 border-red-400 rounded">
                      <div className="font-medium">
                        {mismatch.department} - {mismatch.level}
                      </div>
                      <div className="text-sm text-gray-600">
                        Expected: {mismatch.detailedCount}, Aggregated: {mismatch.aggregatedCount}
                      </div>
                      <div className="text-sm text-gray-600">
                        {mismatch.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detailed Analysis (Optional) */}
      {showDetailedAnalysis && currentReport && (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <button
            onClick={() => toggleSection('detailed')}
            className="flex justify-between items-center w-full text-left"
          >
            <h3 className="text-lg font-semibold">Detailed Analysis</h3>
            <span className="text-gray-400">
              {expandedSections.has('detailed') ? '▼' : '▶'}
            </span>
          </button>

          {expandedSections.has('detailed') && (
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-2">
                Pages covered: {currentReport.summary.pagesCovered.join(', ')}
              </div>
              
              {/* Additional detailed analysis can be added here */}
              <div className="text-sm text-gray-500">
                For more detailed analysis, use the generateDetailedReport() method
                from the ValidationEngine.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {currentReport && currentReport.isValid && currentReport.inconsistencies.length === 0 && (
        <div className="border rounded-lg p-4 bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="text-green-600 mr-2">✓</div>
            <div>
              <h3 className="font-semibold text-green-800">Validation Passed</h3>
              <p className="text-green-700 text-sm">
                All {currentReport.summary.totalPositions} positions have consistent classifications across pages.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationReportComponent;