# Data Consistency Validation Utility

This document describes the data consistency validation utility that implements task 10 from the data-consistency-fixes specification. The utility provides comprehensive validation functionality to ensure data consistency across the entire organization chart application.

## Overview

The Data Consistency Validation Utility consists of three main components:

1. **DataConsistencyValidator Class** - Core validation logic and reporting
2. **CLI Script** - Command-line interface for running validations
3. **Test Suite** - Comprehensive tests covering all validation scenarios

## Requirements Addressed

- **Requirement 2.4**: Ensure sum of Direct + Indirect + OH equals total personnel count
- **Requirement 2.5**: Validate classification changes reflect consistently across aggregation pages
- **Requirement 3.1**: Validate consistent classification across all pages
- **Requirement 3.2**: Log detailed information about discrepancies
- **Requirement 3.3**: Verify aggregation totals match detailed view counts

## Components

### 1. DataConsistencyValidator Class

Located in `components/common/DataConsistencyValidator.ts`, this class provides:

#### Core Methods

- `validateApplicationConsistency()` - Validates entire application data consistency
- `runAutomatedValidationTests()` - Runs automated tests with different scenarios
- `generateValidationSummaryReport()` - Creates comprehensive summary reports
- `quickValidationCheck()` - Performs quick validation for development use

#### Key Features

- **Classification Distribution Analysis** - Shows percentage breakdown of Direct/Indirect/OH positions
- **Department and Level Analysis** - Detailed breakdown by organizational structure
- **Critical Issue Detection** - Identifies and categorizes data consistency problems
- **Automated Scenario Testing** - Tests multiple configuration scenarios
- **Performance Optimization** - Handles large datasets efficiently

### 2. CLI Script

Located in `scripts/validate-data-consistency.js`, provides command-line access:

#### Usage

```bash
# Quick validation check
node scripts/validate-data-consistency.js --mode quick

# Full validation with detailed analysis
node scripts/validate-data-consistency.js --mode full --verbose

# Automated testing with multiple scenarios
node scripts/validate-data-consistency.js --mode automated --output report.json --format json

# Generate HTML report
node scripts/validate-data-consistency.js --mode full --output report.html --format html
```

#### Options

- `--mode <mode>` - Validation mode: quick, full, automated (default: full)
- `--scenarios <file>` - Custom scenarios JSON file path
- `--output <file>` - Output report file path
- `--format <format>` - Output format: json, text, html (default: text)
- `--verbose` - Enable verbose logging
- `--help` - Show help information

### 3. Test Suite

Located in `__tests__/data-consistency-validation.test.ts`, provides comprehensive testing:

- Unit tests for all validation methods
- Integration tests with realistic data
- Performance tests with large datasets
- Edge case handling tests
- Requirement validation tests

## Usage Examples

### Basic Validation in Code

```typescript
import { 
  validateApplicationConsistency,
  quickValidationCheck 
} from '@/components/common/DataConsistencyValidator';

// Quick validation check
const quickResult = await quickValidationCheck({
  page1: [/* page1 positions */],
  page2: [/* page2 positions */],
  page3: [/* page3 positions */],
  separated: [/* separated positions */]
});

console.log(`Health Status: ${quickResult.isHealthy ? 'Healthy' : 'Issues Found'}`);
console.log(`Summary: ${quickResult.quickSummary}`);

// Full validation with aggregation data
const fullResult = await validateApplicationConsistency({
  page1: [/* detailed positions */],
  page2: [/* detailed positions */],
  page3: [/* detailed positions */],
  separated: [/* separated positions */],
  page4Direct: [/* direct aggregation positions */],
  page4Indirect: [/* indirect aggregation positions */]
});

console.log(`Overall Health: ${fullResult.overallHealth}`);
console.log(`Total Positions: ${fullResult.summary.totalPositions}`);
console.log(`Critical Issues: ${fullResult.summary.criticalIssueCount}`);
```

### Automated Testing

```typescript
import { runAutomatedValidationTests } from '@/components/common/DataConsistencyValidator';

// Run with default scenarios
const testResults = await runAutomatedValidationTests();

console.log(`Scenarios Tested: ${testResults.summary.totalScenarios}`);
console.log(`Passed: ${testResults.summary.passedScenarios}`);
console.log(`Failed: ${testResults.summary.failedScenarios}`);
console.log(`Overall Status: ${testResults.summary.overallStatus}`);

// Run with custom scenarios
const customScenarios = [
  {
    name: 'custom_test',
    description: 'Custom test scenario',
    lineCount: 2,
    modelSelection: ['Model A', 'Model B'],
    expectedDirectCount: 4,
    expectedIndirectCount: 8,
    expectedOHCount: 6
  }
];

const customResults = await runAutomatedValidationTests(customScenarios);
```

### CLI Usage Examples

```bash
# Development workflow - quick check
npm run validate:quick

# Pre-deployment - full validation
npm run validate:full

# CI/CD pipeline - automated testing
npm run validate:automated

# Generate reports for analysis
node scripts/validate-data-consistency.js --mode full --output validation-report.html --format html
node scripts/validate-data-consistency.js --mode automated --output test-results.json --format json
```

## Report Structure

### Quick Validation Report

```typescript
{
  isHealthy: boolean;
  criticalIssueCount: number;
  warningCount: number;
  quickSummary: string;
  recommendations: string[];
  classificationDistribution: {
    direct: { count: number; percentage: number; positions: string[] };
    indirect: { count: number; percentage: number; positions: string[] };
    OH: { count: number; percentage: number; positions: string[] };
  };
}
```

### Full Validation Report

```typescript
{
  timestamp: Date;
  scenario: ValidationScenario | null;
  consistencyValidation: ValidationReport;
  aggregationValidation: AggregationValidationResult | null;
  classificationDistribution: ClassificationDistribution;
  departmentAnalysis: Record<string, DepartmentAnalysis>;
  levelAnalysis: Record<string, LevelAnalysis>;
  criticalIssues: CriticalIssue[];
  recommendations: string[];
  overallHealth: 'healthy' | 'warning' | 'critical';
  summary: ValidationSummary;
}
```

### Automated Test Results

```typescript
{
  results: DataConsistencyReport[];
  summary: {
    totalScenarios: number;
    passedScenarios: number;
    failedScenarios: number;
    criticalIssues: number;
    overallStatus: 'pass' | 'warning' | 'fail';
  };
}
```

## Integration with Development Workflow

### Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "validate:quick": "node scripts/validate-data-consistency.js --mode quick",
    "validate:full": "node scripts/validate-data-consistency.js --mode full --verbose",
    "validate:automated": "node scripts/validate-data-consistency.js --mode automated",
    "validate:report": "node scripts/validate-data-consistency.js --mode full --output validation-report.html --format html"
  }
}
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running data consistency validation..."
npm run validate:quick

if [ $? -ne 0 ]; then
  echo "❌ Data consistency validation failed. Please fix issues before committing."
  exit 1
fi

echo "✅ Data consistency validation passed."
```

### CI/CD Integration

```yaml
# .github/workflows/validation.yml
name: Data Consistency Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run validate:automated
      - name: Upload validation report
        uses: actions/upload-artifact@v2
        if: always()
        with:
          name: validation-report
          path: validation-report.json
```

## Configuration Scenarios

The utility supports testing with different configuration scenarios:

### Default Scenarios

1. **Minimal Configuration** - 1 line, basic model selection
2. **Standard Configuration** - 3 lines, multiple models
3. **Maximum Configuration** - 5 lines, all models
4. **Separated Processes Only** - No-sew and HF Welding only

### Custom Scenarios

Create custom scenarios by providing a JSON file:

```json
[
  {
    "name": "custom_scenario",
    "description": "Custom test scenario",
    "lineCount": 2,
    "modelSelection": ["Model A", "Model B"],
    "expectedDirectCount": 4,
    "expectedIndirectCount": 10,
    "expectedOHCount": 8
  }
]
```

## Performance Considerations

- **Large Datasets**: Optimized to handle 1000+ positions efficiently
- **Memory Usage**: Minimal memory footprint with streaming validation
- **Execution Time**: Typical validation completes in under 1 second
- **Concurrent Testing**: Supports parallel scenario execution

## Troubleshooting

### Common Issues

1. **Classification Inconsistencies**
   - Check department and level combinations
   - Verify exception rules are applied correctly
   - Review process-specific classifications

2. **Aggregation Mismatches**
   - Ensure aggregation pages use same classification logic
   - Verify CE TM Mixing appears in direct page
   - Check separated processes are in indirect page

3. **Performance Issues**
   - Use quick validation for frequent checks
   - Limit scenario count for automated testing
   - Consider data size when running full validation

### Debug Mode

Enable verbose logging for detailed troubleshooting:

```bash
node scripts/validate-data-consistency.js --mode full --verbose
```

## Best Practices

1. **Regular Validation** - Run quick checks during development
2. **Pre-deployment Testing** - Always run full validation before releases
3. **Automated Monitoring** - Include validation in CI/CD pipelines
4. **Report Analysis** - Review detailed reports for trends and patterns
5. **Custom Scenarios** - Create scenarios that match your production data

## API Reference

### DataConsistencyValidator

#### Methods

- `validateApplicationConsistency(pageData, scenario?)` - Main validation method
- `runAutomatedValidationTests(scenarios?)` - Automated testing
- `generateValidationSummaryReport(reports)` - Summary generation
- `quickValidationCheck(pageData)` - Quick validation

#### Utility Functions

- `validateApplicationConsistency(pageData, scenario?)` - Standalone validation
- `runAutomatedValidationTests(scenarios?)` - Standalone automated testing
- `quickValidationCheck(pageData)` - Standalone quick check

### CLI Script

#### Exit Codes

- `0` - Validation passed
- `1` - Validation failed or errors found

#### Output Formats

- **Text** - Human-readable console output
- **JSON** - Machine-readable structured data
- **HTML** - Formatted report for web viewing

## Contributing

When contributing to the validation utility:

1. Add tests for new validation rules
2. Update documentation for new features
3. Ensure backward compatibility
4. Test with realistic data scenarios
5. Follow existing code patterns and conventions

## Support

For issues or questions about the validation utility:

1. Check the test suite for usage examples
2. Review the CLI help with `--help` flag
3. Examine the source code documentation
4. Create issues for bugs or feature requests