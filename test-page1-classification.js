// Quick test to verify Page1 classification integration
const { classifyPosition } = require('./components/common/ClassificationEngine.ts');

console.log('Testing Page1 classification integration...');

// Test PM classification
const pmClassification = classifyPosition('Line', 'PM', undefined, 'Plant Manager', 'PM');
console.log('PM classification:', pmClassification); // Should be 'OH'

// Test LM classification  
const lmClassification = classifyPosition('Line', 'LM', undefined, 'Line 1-2 [100명]', 'LM');
console.log('LM classification:', lmClassification); // Should be 'OH'

// Test GL classification
const glClassification = classifyPosition('Line', 'GL', undefined, 'Stitching', 'GL');
console.log('GL classification:', glClassification); // Should be 'indirect'

// Test No-sew GL classification
const nosewGLClassification = classifyPosition('No-sew', 'GL', 'No-sew', 'No-sew A', 'GL');
console.log('No-sew GL classification:', nosewGLClassification); // Should be 'direct'

// Test No-sew TL classification
const nosewTLClassification = classifyPosition('No-sew', 'TL', 'No-sew', 'Line 1 No-sew A', 'TL');
console.log('No-sew TL classification:', nosewTLClassification); // Should be 'direct'

// Test No-sew TM classification
const nosewTMClassification = classifyPosition('No-sew', 'TM', 'No-sew', 'Line 1 No-sew A', 'TM');
console.log('No-sew TM classification:', nosewTMClassification); // Should be 'direct'

// Test HF Welding GL classification
const hfGLClassification = classifyPosition('HF Welding', 'GL', 'HF Welding', 'HF Welding A', 'GL');
console.log('HF Welding GL classification:', hfGLClassification); // Should be 'direct'

// Test HF Welding TL classification
const hfTLClassification = classifyPosition('HF Welding', 'TL', 'HF Welding', 'Line 1 HF Welding A', 'TL');
console.log('HF Welding TL classification:', hfTLClassification); // Should be 'direct'

// Test HF Welding TM classification
const hfTMClassification = classifyPosition('HF Welding', 'TM', 'HF Welding', 'HF Welding A 1', 'TM');
console.log('HF Welding TM classification:', hfTMClassification); // Should be 'direct'

console.log('All tests completed!');