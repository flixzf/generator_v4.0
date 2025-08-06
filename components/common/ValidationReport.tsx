/**
 * Validation Report Component
 * 
 * This component displays validation results and inconsistencies in a user-friendly format.
 */

"use client";

import React, { useState } from 'react';
import { 
  ValidationReport as ValidationReportType, 
  Inconsistency, 
  AggregationValidationResult,
  PositionValidationResult 
} from './ValidationEngine';

interface ValidationReportProps {
  report?: ValidationReportType;
  aggregationReport?: AggregationValidationResult;
  className?: string;
}

export const ValidationReport: React.FC<ValidationReportProps> = ({
  report,
  aggregationReport,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'consistency' | 'aggregation'>('consistency');
  const [expandedInconsistency, setExpandedInconsistency] = useState<string | null>(null);

  if (!report && !aggregationReport) {
    return (
      <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-600">No validation data available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {report && (
            <button
              onClick={() => setActiveTab('consistency')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'consistency'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Consistency Check
            </button>
          )}
          {aggregationReport && (
            <button
              onClick={() => setActiveTab('aggregation')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'aggregation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Aggregation Check
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'consistency' && report && (
          <ConsistencyReport report={report} 
            expandedInconsistency={expandedInconsistency}
            setExpandedInconsistency={setExpandedInconsistency}
          />
        )}
        {activeTab === 'aggregation' && aggregationReport && (
          <AggregationReport report={aggregationReport} />
        )}
      </div>
    </div>
  );
};

interface ConsistencyReportProps {
  report: ValidationReportType;
  expandedInconsistency: string | null;
  setExpandedInconsistency: (id: string | null) => void;
}

const ConsistencyReport: React.FC<ConsistencyReportProps> = ({
  report,
  expandedInconsistency,
  setExpandedInconsistency
}) => {
  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`p-4 rounded-lg ${
        report.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${
            report.isValid ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <h3 className={`text-lg font-semibold ${
            report.isValid ? 'text-green-800' : 'text-red-800'
          }`}>
            {report.isValid ? 'All Classifications Consistent' : 'Classification Inconsistencies Found'}
          </h3>
        </div>
        <p className={`mt-2 text-sm ${
          report.isValid ? 'text-green-700' : 'text-red-700'
        }`}>
          {report.isValid 
            ? 'All personnel classifications are consistent across pages.'
            : `Found ${report.inconsistencies.length} inconsistencies that need attention.`
          }
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{report.summary.totalPositions}</div>
          <div className="text-sm text-blue-800">Total Positions</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{report.summary.validPositions}</div>
          <div className="text-sm text-green-800">Valid Positions</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{report.summary.inconsistentPositions}</div>
          <div className="text-sm text-red-800">Inconsistent</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{report.summary.pagesCovered.length}</div>
          <div className="text-sm text-gray-800">Pages Checked</div>
        </div>
      </div>

      {/* Classification Distribution */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-3">Classification Distribution</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{report.summary.classificationCounts.direct}</div>
            <div className="text-sm text-gray-600">Direct</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-600">{report.summary.classificationCounts.indirect}</div>
            <div className="text-sm text-gray-600">Indirect</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">{report.summary.classificationCounts.OH}</div>
            <div className="text-sm text-gray-600">OH</div>
          </div>
        </div>
      </div>

      {/* Inconsistencies List */}
      {report.inconsistencies.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3">Inconsistencies</h4>
          <div className="space-y-2">
            {report.inconsistencies.map((inconsistency, index) => (
              <InconsistencyItem
                key={`${inconsistency.positionId}-${index}`}
                inconsistency={inconsistency}
                isExpanded={expandedInconsistency === `${inconsistency.positionId}-${index}`}
                onToggle={() => setExpandedInconsistency(
                  expandedInconsistency === `${inconsistency.positionId}-${index}` 
                    ? null 
                    : `${inconsistency.positionId}-${index}`
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-gray-500 border-t pt-4">
        Report generated: {report.timestamp.toLocaleString()}
      </div>
    </div>
  );
};

interface AggregationReportProps {
  report: AggregationValidationResult;
}

const AggregationReport: React.FC<AggregationReportProps> = ({ report }) => {
  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`p-4 rounded-lg ${
        report.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${
            report.isValid ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <h3 className={`text-lg font-semibold ${
            report.isValid ? 'text-green-800' : 'text-red-800'
          }`}>
            {report.isValid ? 'Aggregation Totals Match' : 'Aggregation Mismatches Found'}
          </h3>
        </div>
      </div>

      {/* Totals Comparison */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{report.directPageTotal}</div>
          <div className="text-sm text-blue-800">Direct Page</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{report.indirectPageTotal}</div>
          <div className="text-sm text-yellow-800">Indirect Page</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{report.ohPageTotal}</div>
          <div className="text-sm text-purple-800">OH Page</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{report.detailedViewTotal}</div>
          <div className="text-sm text-gray-800">Detailed Views</div>
        </div>
      </div>

      {/* Mismatches */}
      {report.mismatches.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3">Aggregation Mismatches</h4>
          <div className="space-y-2">
            {report.mismatches.map((mismatch, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-semibold text-red-800">
                      {mismatch.department} - {mismatch.level}
                    </h5>
                    <p className="text-sm text-red-700 mt-1">{mismatch.reason}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-red-600">
                      Expected: {mismatch.detailedCount}
                    </div>
                    <div className="text-sm text-red-600">
                      Actual: {mismatch.aggregatedCount}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface InconsistencyItemProps {
  inconsistency: Inconsistency;
  isExpanded: boolean;
  onToggle: () => void;
}

const InconsistencyItem: React.FC<InconsistencyItemProps> = ({
  inconsistency,
  isExpanded,
  onToggle
}) => {
  return (
    <div className={`border rounded-lg ${
      inconsistency.severity === 'error' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
    }`}>
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-opacity-80 transition-colors"
      >
        <div className="flex justify-between items-start">
          <div>
            <h5 className={`font-semibold ${
              inconsistency.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {inconsistency.department} - {inconsistency.level}
              {inconsistency.subtitle && ` (${inconsistency.subtitle})`}
            </h5>
            <p className={`text-sm mt-1 ${
              inconsistency.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
            }`}>
              Expected: {inconsistency.expectedClassification}, 
              Found: {inconsistency.actualClassification}
            </p>
          </div>
          <div className={`text-xs px-2 py-1 rounded ${
            inconsistency.severity === 'error' 
              ? 'bg-red-200 text-red-800' 
              : 'bg-yellow-200 text-yellow-800'
          }`}>
            {inconsistency.severity.toUpperCase()}
          </div>
        </div>
      </button>
      
      {isExpanded && (
        <div className={`px-4 pb-4 border-t ${
          inconsistency.severity === 'error' ? 'border-red-200' : 'border-yellow-200'
        }`}>
          <div className="mt-3 space-y-2">
            <div>
              <span className="text-sm font-medium">Reason:</span>
              <p className="text-sm mt-1">{inconsistency.reason}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Pages:</span>
              <p className="text-sm mt-1">{inconsistency.pages.join(', ')}</p>
            </div>
            {inconsistency.title && (
              <div>
                <span className="text-sm font-medium">Title:</span>
                <p className="text-sm mt-1">{inconsistency.title}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationReport;