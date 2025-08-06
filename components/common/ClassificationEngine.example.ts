/**
 * Classification Engine Usage Examples
 * 
 * This file demonstrates how to use the centralized classification engine
 * to ensure consistent personnel classification across the application.
 */

import { 
  classifyPosition, 
  validatePosition, 
  classificationEngine,
  Position 
} from './ClassificationEngine';

// Example 1: Basic classification using the utility function
console.log('=== Basic Classification Examples ===');

// Level-based classifications (highest priority)
console.log('PM Level (always OH):', classifyPosition('Line', 'PM')); // OH
console.log('LM Level (always OH):', classifyPosition('Quality', 'LM')); // OH

// Department-specific classifications
console.log('Line TM:', classifyPosition('Line', 'TM')); // indirect
console.log('Quality GL:', classifyPosition('Quality', 'GL')); // OH
console.log('CE TM:', classifyPosition('CE', 'TM')); // direct
console.log('Admin positions:', classifyPosition('Admin', 'TL')); // OH

// Example 2: Process-specific classifications
console.log('\n=== Process-Specific Classifications ===');
console.log('No-sew process:', classifyPosition('Line', 'TM', 'No-sew')); // direct
console.log('HF Welding process:', classifyPosition('Line', 'GL', 'HF Welding')); // direct

// Example 3: Exception rules with position objects
console.log('\n=== Exception Rule Examples ===');

const ceMixingPosition: Position = {
  id: 'ce-mixing-1',
  department: 'CE',
  level: 'TM',
  title: 'CE TM Mixing Line 1',
  subtitle: 'Mixing',
  source: 'page1'
};

const fgwhShippingPosition: Position = {
  id: 'fgwh-shipping-1',
  department: 'FG WH',
  level: 'TM',
  title: 'FG WH TM Shipping',
  subtitle: 'Shipping Operations',
  source: 'page2'
};

console.log('CE TM Mixing:', classificationEngine.classifyPositionObject(ceMixingPosition)); // direct
console.log('FG WH TM Shipping:', classificationEngine.classifyPositionObject(fgwhShippingPosition)); // OH

// Example 4: Validation
console.log('\n=== Validation Examples ===');

const validPosition: Position = {
  id: 'valid-pos',
  department: 'Line',
  level: 'TM',
  title: 'Line TM',
  source: 'page1'
};

const invalidPosition: Position = {
  id: 'invalid-pos',
  department: '', // Missing department
  level: 'TM',
  title: 'Invalid Position',
  classification: 'direct', // Wrong classification
  source: 'page1'
};

console.log('Valid position validation:', validatePosition(validPosition));
console.log('Invalid position validation:', validatePosition(invalidPosition));

// Example 5: Comprehensive department coverage
console.log('\n=== All Department Classifications ===');

const departments = [
  'Line', 'Quality', 'CE', 'Admin', 'Small Tooling', 
  'Raw Material', 'Sub Material', 'ACC Market', 'P&L Market', 
  'Bottom Market', 'Plant Production', 'FG WH', 'TPM', 
  'CQM', 'Lean', 'Security', 'RMCC'
];

departments.forEach(dept => {
  console.log(`${dept} TM:`, classifyPosition(dept, 'TM'));
});

// Example 6: Using the engine for page-specific logic
console.log('\n=== Page Integration Example ===');

// Simulate positions from different pages
const page1Positions: Position[] = [
  {
    id: 'line-pm-1',
    department: 'Line',
    level: 'PM',
    title: 'Line PM',
    source: 'page1'
  },
  {
    id: 'line-gl-1',
    department: 'Line',
    level: 'GL',
    title: 'Line GL Cutting',
    source: 'page1'
  }
];

const separatedProcesses: Position[] = [
  {
    id: 'nosew-gl-1',
    department: 'Line',
    level: 'GL',
    title: 'No-sew GL',
    processType: 'No-sew',
    source: 'separated'
  },
  {
    id: 'hf-welding-tm-1',
    department: 'Line',
    level: 'TM',
    title: 'HF Welding TM',
    processType: 'HF Welding',
    source: 'separated'
  }
];

console.log('Page 1 Classifications:');
page1Positions.forEach(pos => {
  const classification = classificationEngine.classifyPositionObject(pos);
  console.log(`  ${pos.title}: ${classification}`);
});

console.log('Separated Process Classifications:');
separatedProcesses.forEach(pos => {
  const classification = classificationEngine.classifyPositionObject(pos);
  console.log(`  ${pos.title}: ${classification}`);
});

export { };