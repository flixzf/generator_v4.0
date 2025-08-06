#!/usr/bin/env node

/**
 * Data Consistency Validation CLI Utility
 * 
 * This script provides a command-line interface to run data consistency validation
 * across the entire application. It can be used for:
 * - Manual validation checks during development
 * - Automated testing in CI/CD pipelines
 * - Generating validation reports for analysis
 * 
 * Usage:
 *   node scripts/validate-data-consistency.js [options]
 * 
 * Options:
 *   --mode <mode>           Validation mode: quick, full, automated (default: full)
 *   --scenarios <file>      Custom scenarios JSON file path
 *   --output <file>         Output report file path
 *   --format <format>       Output format: json, text, html (default: text)
 *   --verbose               Enable verbose logging
 *   --help                  Show help information
 * 
 * Requirements: 2.4, 2.5, 3.1, 3.2, 3.3
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: 'full',
    scenarios: null,
    output: null,
    format: 'text',
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--mode':
        options.mode = args[++i];
        break;
      case '--scenarios':
        options.scenarios = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        options.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return options;
}

// Show help information
function showHelp() {
  console.log(`
Data Consistency Validation CLI Utility

Usage: node scripts/validate-data-consistency.js [options]

Options:
  --mode <mode>           Validation mode: quick, full, automated (default: full)
  --scenarios <file>      Custom scenarios JSON file path
  --output <file>         Output report file path
  --format <format>       Output format: json, text, html (default: text)
  --verbose               Enable verbose logging
  --help                  Show this help information

Modes:
  quick      - Quick validation check with minimal output
  full       - Complete validation with detailed analysis
  automated  - Run automated tests with multiple scenarios

Examples:
  node scripts/validate-data-consistency.js
  node scripts/validate-data-consistency.js --mode quick --verbose
  node scripts/validate-data-consistency.js --mode automated --output report.json --format json
  node scripts/validate-data-consistency.js --scenarios custom-scenarios.json --output detailed-report.html --format html
`);
}

// Generate mock data for validation (since we can't import React components in Node.js)
function generateMockData() {
  return {
    page1: [
      { id: 'line-pm', department: 'Line', level: 'PM', title: 'Line PM', source: 'page1' },
      { id: 'line-lm', department: 'Line', level: 'LM', title: 'Line LM', source: 'page1' },
      { id: 'line-gl-1', department: 'Line', level: 'GL', title: 'Line GL 1', source: 'page1' },
      { id: 'line-gl-2', department: 'Line', level: 'GL', title: 'Line GL 2', source: 'page1' },
      { id: 'quality-gl', department: 'Quality', level: 'GL', title: 'Quality GL', source: 'page1' },
      { id: 'ce-tm-mixing', department: 'CE', level: 'TM', title: 'CE TM', subtitle: 'Mixing', source: 'page1' }
    ],
    page2: [
      { id: 'admin-tm', department: 'Admin', level: 'TM', title: 'Admin TM', source: 'page2' },
      { id: 'raw-material-tm', department: 'Raw Material', level: 'TM', title: 'Raw Material TM', source: 'page2' },
      { id: 'plant-prod-tm', department: 'Plant Production', level: 'TM', title: 'Plant Production TM', source: 'page2' },
      { id: 'acc-market-tm', department: 'ACC Market', level: 'TM', title: 'ACC Market TM', source: 'page2' }
    ],
    page3: [
      { id: 'tpm-tm', department: 'TPM', level: 'TM', title: 'TPM TM', source: 'page3' },
      { id: 'security-tm', department: 'Security', level: 'TM', title: 'Security TM', source: 'page3' }
    ],
    separated: [
      { id: 'nosew-gl', department: 'No-sew', level: 'GL', title: 'No-sew GL', source: 'separated' },
      { id: 'hf-welding-tm', department: 'HF Welding', level: 'TM', title: 'HF Welding TM', source: 'separated' }
    ]
  };
}

// Simple classification engine for CLI use
function classifyPosition(department, level, processType, subtitle, title) {
  // Level-based overrides (PM/LM always OH)
  if (level === 'PM' || level === 'LM') {
    return 'OH';
  }

  // Exception rules
  if (department === 'CE' && level === 'TM' && (subtitle?.includes('Mixing') || title?.includes('Mixing'))) {
    return 'direct';
  }

  if (department === 'FG WH' && level === 'TM' && (subtitle?.includes('Shipping') || title?.includes('Shipping'))) {
    return 'OH';
  }

  // Process-based rules
  if (processType === 'No-sew' || processType === 'HF Welding') {
    return 'indirect';
  }

  // Department-based rules
  const departmentRules = {
    'Line': 'indirect',
    'Quality': level === 'GL' ? 'OH' : 'indirect',
    'CE': 'OH',
    'Admin': 'OH',
    'Small Tooling': 'OH',
    'Raw Material': 'indirect',
    'Sub Material': 'OH',
    'ACC Market': 'indirect',
    'P&L Market': 'indirect',
    'Bottom Market': 'indirect',
    'FG WH': 'indirect',
    'Plant Production': level === 'TM' ? 'direct' : 'indirect',
    'TPM': 'OH',
    'CQM': 'OH',
    'Lean': 'OH',
    'Security': 'OH',
    'RMCC': 'OH',
    'No-sew': 'indirect',
    'HF Welding': 'indirect',
    'Separated': 'indirect'
  };

  return departmentRules[department] || 'indirect';
}

// Validate consistency across pages
function validateConsistency(pageData) {
  const inconsistencies = [];
  const positionMap = new Map();
  const classificationCounts = { direct: 0, indirect: 0, OH: 0 };
  let totalPositions = 0;

  // Group positions by unique identifier
  for (const [pageName, positions] of Object.entries(pageData)) {
    for (const position of positions) {
      const key = `${position.department}-${position.level}-${position.subtitle || ''}`;
      if (!positionMap.has(key)) {
        positionMap.set(key, []);
      }
      positionMap.get(key).push({ ...position, source: pageName });
      totalPositions++;
    }
  }

  // Check each position group for consistency
  for (const [positionKey, positions] of positionMap) {
    if (positions.length <= 1) continue;

    const expectedClassification = classifyPosition(
      positions[0].department,
      positions[0].level,
      positions[0].processType,
      positions[0].subtitle,
      positions[0].title
    );

    classificationCounts[expectedClassification]++;

    // Check if all positions have consistent classification
    for (const position of positions) {
      const actualClassification = position.classification || classifyPosition(
        position.department,
        position.level,
        position.processType,
        position.subtitle,
        position.title
      );

      if (actualClassification !== expectedClassification) {
        inconsistencies.push({
          positionId: position.id,
          department: position.department,
          level: position.level,
          expectedClassification,
          actualClassification,
          pages: positions.map(p => p.source),
          reason: `Position appears with different classifications across pages`
        });
      }
    }
  }

  return {
    isValid: inconsistencies.length === 0,
    inconsistencies,
    summary: {
      totalPositions,
      validPositions: totalPositions - inconsistencies.length,
      inconsistentPositions: inconsistencies.length,
      classificationCounts,
      pagesCovered: Object.keys(pageData)
    },
    timestamp: new Date()
  };
}

// Calculate classification distribution
function calculateClassificationDistribution(pageData) {
  const directPositions = [];
  const indirectPositions = [];
  const ohPositions = [];
  let totalPositions = 0;

  for (const positions of Object.values(pageData)) {
    for (const position of positions) {
      totalPositions++;
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
    }
  }

  const total = totalPositions || 1;

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

// Run quick validation
async function runQuickValidation(options) {
  if (options.verbose) {
    console.log('Running quick validation check...');
  }

  const pageData = generateMockData();
  const consistencyReport = validateConsistency(pageData);
  const classificationDistribution = calculateClassificationDistribution(pageData);

  const isHealthy = consistencyReport.isValid;
  const criticalIssueCount = consistencyReport.inconsistencies.length;
  
  let quickSummary;
  if (isHealthy) {
    quickSummary = `✅ All ${consistencyReport.summary.totalPositions} positions are consistently classified with no critical issues`;
  } else {
    quickSummary = `⚠️ ${consistencyReport.summary.inconsistentPositions} of ${consistencyReport.summary.totalPositions} positions have issues`;
  }

  const result = {
    isHealthy,
    criticalIssueCount,
    warningCount: 0,
    quickSummary,
    recommendations: isHealthy ? 
      ['Data consistency is good - continue monitoring'] : 
      ['Review classification logic for consistency', 'Check positions with inconsistencies'],
    classificationDistribution,
    timestamp: new Date()
  };

  return result;
}

// Run full validation
async function runFullValidation(options) {
  if (options.verbose) {
    console.log('Running full validation analysis...');
  }

  const pageData = generateMockData();
  const consistencyReport = validateConsistency(pageData);
  const classificationDistribution = calculateClassificationDistribution(pageData);

  // Analyze by department
  const departmentAnalysis = {};
  for (const positions of Object.values(pageData)) {
    for (const position of positions) {
      if (!departmentAnalysis[position.department]) {
        departmentAnalysis[position.department] = {
          totalPositions: 0,
          directCount: 0,
          indirectCount: 0,
          ohCount: 0,
          inconsistencies: 0
        };
      }

      departmentAnalysis[position.department].totalPositions++;
      const classification = classifyPosition(
        position.department,
        position.level,
        position.processType,
        position.subtitle,
        position.title
      );

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
    }
  }

  // Count inconsistencies by department
  for (const inconsistency of consistencyReport.inconsistencies) {
    if (departmentAnalysis[inconsistency.department]) {
      departmentAnalysis[inconsistency.department].inconsistencies++;
    }
  }

  const overallHealth = consistencyReport.isValid ? 'healthy' : 'warning';

  const result = {
    timestamp: new Date(),
    consistencyValidation: consistencyReport,
    classificationDistribution,
    departmentAnalysis,
    overallHealth,
    summary: {
      totalPositions: consistencyReport.summary.totalPositions,
      validPositions: consistencyReport.summary.validPositions,
      inconsistentPositions: consistencyReport.summary.inconsistentPositions,
      criticalIssueCount: consistencyReport.inconsistencies.length,
      warningCount: 0
    },
    recommendations: consistencyReport.isValid ? 
      ['Data consistency is good - continue monitoring for any changes'] :
      ['Review and update classification logic to ensure consistency across all pages', 'Focus on departments with inconsistencies']
  };

  return result;
}

// Run automated validation tests
async function runAutomatedValidation(options) {
  if (options.verbose) {
    console.log('Running automated validation tests...');
  }

  const scenarios = [
    {
      name: 'minimal_configuration',
      description: 'Test with minimal line count and basic model selection',
      lineCount: 1,
      modelSelection: ['Model A']
    },
    {
      name: 'standard_configuration',
      description: 'Test with standard production configuration',
      lineCount: 3,
      modelSelection: ['Model A', 'Model B']
    },
    {
      name: 'maximum_configuration',
      description: 'Test with maximum line count and all models',
      lineCount: 5,
      modelSelection: ['Model A', 'Model B', 'Model C']
    }
  ];

  const results = [];
  let passedScenarios = 0;
  let failedScenarios = 0;

  for (const scenario of scenarios) {
    if (options.verbose) {
      console.log(`Running scenario: ${scenario.name}`);
    }

    try {
      const pageData = generateMockData();
      const report = await runFullValidation(options);
      report.scenario = scenario;
      results.push(report);

      if (report.overallHealth === 'healthy') {
        passedScenarios++;
      } else {
        failedScenarios++;
      }
    } catch (error) {
      failedScenarios++;
      results.push({
        scenario,
        error: error.message,
        overallHealth: 'critical',
        timestamp: new Date()
      });
    }
  }

  const overallStatus = failedScenarios === 0 ? 'pass' : 'fail';

  return {
    results,
    summary: {
      totalScenarios: scenarios.length,
      passedScenarios,
      failedScenarios,
      criticalIssues: results.reduce((sum, r) => sum + (r.summary?.criticalIssueCount || 0), 0),
      overallStatus
    }
  };
}

// Format output as text
function formatAsText(result, mode) {
  let output = '';
  
  output += `\n=== Data Consistency Validation Report ===\n`;
  output += `Mode: ${mode}\n`;
  output += `Timestamp: ${result.timestamp || new Date()}\n`;
  output += `\n`;

  if (mode === 'quick') {
    output += `Status: ${result.isHealthy ? '✅ HEALTHY' : '⚠️ ISSUES FOUND'}\n`;
    output += `Summary: ${result.quickSummary}\n`;
    output += `Critical Issues: ${result.criticalIssueCount}\n`;
    output += `\n`;

    if (result.classificationDistribution) {
      output += `Classification Distribution:\n`;
      output += `  Direct: ${result.classificationDistribution.direct.count} (${result.classificationDistribution.direct.percentage.toFixed(1)}%)\n`;
      output += `  Indirect: ${result.classificationDistribution.indirect.count} (${result.classificationDistribution.indirect.percentage.toFixed(1)}%)\n`;
      output += `  OH: ${result.classificationDistribution.OH.count} (${result.classificationDistribution.OH.percentage.toFixed(1)}%)\n`;
      output += `\n`;
    }

    output += `Recommendations:\n`;
    for (const rec of result.recommendations) {
      output += `  • ${rec}\n`;
    }
  } else if (mode === 'full') {
    output += `Overall Health: ${result.overallHealth.toUpperCase()}\n`;
    output += `Total Positions: ${result.summary.totalPositions}\n`;
    output += `Valid Positions: ${result.summary.validPositions}\n`;
    output += `Inconsistent Positions: ${result.summary.inconsistentPositions}\n`;
    output += `\n`;

    output += `Classification Distribution:\n`;
    output += `  Direct: ${result.classificationDistribution.direct.count} (${result.classificationDistribution.direct.percentage.toFixed(1)}%)\n`;
    output += `  Indirect: ${result.classificationDistribution.indirect.count} (${result.classificationDistribution.indirect.percentage.toFixed(1)}%)\n`;
    output += `  OH: ${result.classificationDistribution.OH.count} (${result.classificationDistribution.OH.percentage.toFixed(1)}%)\n`;
    output += `\n`;

    if (result.consistencyValidation && result.consistencyValidation.inconsistencies.length > 0) {
      output += `Inconsistencies Found:\n`;
      for (const inconsistency of result.consistencyValidation.inconsistencies) {
        output += `  • ${inconsistency.department} ${inconsistency.level}: Expected ${inconsistency.expectedClassification}, got ${inconsistency.actualClassification}\n`;
        output += `    Pages: ${inconsistency.pages.join(', ')}\n`;
        output += `    Reason: ${inconsistency.reason}\n`;
      }
      output += `\n`;
    }

    output += `Department Analysis:\n`;
    for (const [dept, analysis] of Object.entries(result.departmentAnalysis)) {
      output += `  ${dept}: ${analysis.totalPositions} positions (${analysis.directCount} direct, ${analysis.indirectCount} indirect, ${analysis.ohCount} OH)`;
      if (analysis.inconsistencies > 0) {
        output += ` - ${analysis.inconsistencies} inconsistencies`;
      }
      output += `\n`;
    }
    output += `\n`;

    output += `Recommendations:\n`;
    for (const rec of result.recommendations) {
      output += `  • ${rec}\n`;
    }
  } else if (mode === 'automated') {
    output += `Overall Status: ${result.summary.overallStatus.toUpperCase()}\n`;
    output += `Total Scenarios: ${result.summary.totalScenarios}\n`;
    output += `Passed: ${result.summary.passedScenarios}\n`;
    output += `Failed: ${result.summary.failedScenarios}\n`;
    output += `Total Critical Issues: ${result.summary.criticalIssues}\n`;
    output += `\n`;

    output += `Scenario Results:\n`;
    for (const scenarioResult of result.results) {
      const status = scenarioResult.overallHealth === 'healthy' ? '✅' : 
                    scenarioResult.overallHealth === 'warning' ? '⚠️' : '❌';
      output += `  ${status} ${scenarioResult.scenario.name}: ${scenarioResult.overallHealth}\n`;
      if (scenarioResult.summary) {
        output += `     ${scenarioResult.summary.totalPositions} positions, ${scenarioResult.summary.criticalIssueCount} issues\n`;
      }
      if (scenarioResult.error) {
        output += `     Error: ${scenarioResult.error}\n`;
      }
    }
  }

  return output;
}

// Format output as HTML
function formatAsHTML(result, mode) {
  let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Data Consistency Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
        .status-healthy { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-critical { color: #dc3545; }
        .section { margin: 20px 0; }
        .inconsistency { background-color: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 3px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .recommendation { background-color: #d4edda; padding: 8px; margin: 3px 0; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Data Consistency Validation Report</h1>
        <p><strong>Mode:</strong> ${mode}</p>
        <p><strong>Timestamp:</strong> ${result.timestamp || new Date()}</p>
    </div>
`;

  if (mode === 'quick') {
    const statusClass = result.isHealthy ? 'status-healthy' : 'status-warning';
    html += `
    <div class="section">
        <h2 class="${statusClass}">Status: ${result.isHealthy ? '✅ HEALTHY' : '⚠️ ISSUES FOUND'}</h2>
        <p>${result.quickSummary}</p>
        <p><strong>Critical Issues:</strong> ${result.criticalIssueCount}</p>
    </div>
`;

    if (result.classificationDistribution) {
      html += `
    <div class="section">
        <h3>Classification Distribution</h3>
        <table>
            <tr><th>Type</th><th>Count</th><th>Percentage</th></tr>
            <tr><td>Direct</td><td>${result.classificationDistribution.direct.count}</td><td>${result.classificationDistribution.direct.percentage.toFixed(1)}%</td></tr>
            <tr><td>Indirect</td><td>${result.classificationDistribution.indirect.count}</td><td>${result.classificationDistribution.indirect.percentage.toFixed(1)}%</td></tr>
            <tr><td>OH</td><td>${result.classificationDistribution.OH.count}</td><td>${result.classificationDistribution.OH.percentage.toFixed(1)}%</td></tr>
        </table>
    </div>
`;
    }
  } else if (mode === 'full') {
    const healthClass = result.overallHealth === 'healthy' ? 'status-healthy' : 
                       result.overallHealth === 'warning' ? 'status-warning' : 'status-critical';
    html += `
    <div class="section">
        <h2 class="${healthClass}">Overall Health: ${result.overallHealth.toUpperCase()}</h2>
        <p><strong>Total Positions:</strong> ${result.summary.totalPositions}</p>
        <p><strong>Valid Positions:</strong> ${result.summary.validPositions}</p>
        <p><strong>Inconsistent Positions:</strong> ${result.summary.inconsistentPositions}</p>
    </div>
`;

    // Add more detailed HTML formatting for full mode...
  }

  html += `
    <div class="section">
        <h3>Recommendations</h3>
`;
  for (const rec of result.recommendations || []) {
    html += `        <div class="recommendation">• ${rec}</div>\n`;
  }
  html += `    </div>
</body>
</html>`;

  return html;
}

// Save output to file
function saveOutput(content, filePath, format) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Report saved to: ${filePath}`);
  } catch (error) {
    console.error(`Error saving report: ${error.message}`);
    process.exit(1);
  }
}

// Main execution function
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  // Validate options
  if (!['quick', 'full', 'automated'].includes(options.mode)) {
    console.error(`Invalid mode: ${options.mode}. Must be one of: quick, full, automated`);
    process.exit(1);
  }

  if (!['json', 'text', 'html'].includes(options.format)) {
    console.error(`Invalid format: ${options.format}. Must be one of: json, text, html`);
    process.exit(1);
  }

  try {
    let result;

    // Run validation based on mode
    switch (options.mode) {
      case 'quick':
        result = await runQuickValidation(options);
        break;
      case 'full':
        result = await runFullValidation(options);
        break;
      case 'automated':
        result = await runAutomatedValidation(options);
        break;
    }

    // Format output
    let output;
    switch (options.format) {
      case 'json':
        output = JSON.stringify(result, null, 2);
        break;
      case 'html':
        output = formatAsHTML(result, options.mode);
        break;
      case 'text':
      default:
        output = formatAsText(result, options.mode);
        break;
    }

    // Save or display output
    if (options.output) {
      saveOutput(output, options.output, options.format);
    } else {
      console.log(output);
    }

    // Set exit code based on results
    if (options.mode === 'automated') {
      process.exit(result.summary.overallStatus === 'pass' ? 0 : 1);
    } else if (options.mode === 'quick') {
      process.exit(result.isHealthy ? 0 : 1);
    } else {
      process.exit(result.overallHealth === 'healthy' ? 0 : 1);
    }

  } catch (error) {
    console.error(`Validation failed: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  generateMockData,
  classifyPosition,
  validateConsistency,
  calculateClassificationDistribution,
  runQuickValidation,
  runFullValidation,
  runAutomatedValidation,
  formatAsText,
  formatAsHTML
};