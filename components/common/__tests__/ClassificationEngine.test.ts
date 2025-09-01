/**
 * Unit tests for ClassificationEngine
 * 
 * Tests all department and level combinations to ensure consistent classification
 * according to the requirements.
 */

import { 
  ClassificationEngine, 
  classificationEngine, 
  classifyPosition, 
  validatePosition,
  normalizeDepartmentName,
  Position 
} from '../ClassificationEngine';

describe('ClassificationEngine', () => {
  let engine: ClassificationEngine;

  beforeEach(() => {
    engine = new ClassificationEngine();
  });

  describe('Level-based overrides (highest priority)', () => {
    test('VSM level should always be OH regardless of department', () => {
      expect(classifyPosition('Line', 'VSM')).toBe('OH');
      expect(classifyPosition('Quality', 'VSM')).toBe('OH');
      expect(classifyPosition('CE', 'VSM')).toBe('OH');
      expect(classifyPosition('Admin', 'VSM')).toBe('OH');
    });

    test('A.VSM level should always be OH regardless of department', () => {
      expect(classifyPosition('Line', 'A.VSM')).toBe('OH');
      expect(classifyPosition('Quality', 'A.VSM')).toBe('OH');
      expect(classifyPosition('CE', 'A.VSM')).toBe('OH');
      expect(classifyPosition('Admin', 'A.VSM')).toBe('OH');
    });
  });

  describe('Department-specific classification rules', () => {
    test('Line department classifications', () => {
      // VSM/A.VSM are OH (covered by level rules)
      expect(classifyPosition('Line', 'GL')).toBe('indirect');
      expect(classifyPosition('Line', 'TL')).toBe('indirect');
      expect(classifyPosition('Line', 'TM')).toBe('indirect');
    });

    test('Quality department classifications', () => {
      expect(classifyPosition('Quality', 'GL')).toBe('OH');
      expect(classifyPosition('Quality', 'TL')).toBe('indirect');
      expect(classifyPosition('Quality', 'TM')).toBe('indirect');
    });

    test('CE department classifications', () => {
      expect(classifyPosition('CE', 'GL')).toBe('OH');
      expect(classifyPosition('CE', 'TL')).toBe('OH');
      expect(classifyPosition('CE', 'TM')).toBe('OH'); // Default is OH, only Mixing is direct
    });

    test('Admin department should be OH', () => {
      expect(classifyPosition('Admin', 'GL')).toBe('OH');
      expect(classifyPosition('Admin', 'TL')).toBe('OH');
      expect(classifyPosition('Admin', 'TM')).toBe('OH');
    });

    test('Small Tooling department should be OH', () => {
      expect(classifyPosition('Small Tooling', 'GL')).toBe('OH');
      expect(classifyPosition('Small Tooling', 'TL')).toBe('OH');
      expect(classifyPosition('Small Tooling', 'TM')).toBe('OH');
    });

    test('Raw Material department should be indirect', () => {
      expect(classifyPosition('Raw Material', 'GL')).toBe('indirect');
      expect(classifyPosition('Raw Material', 'TL')).toBe('indirect');
      expect(classifyPosition('Raw Material', 'TM')).toBe('indirect');
      
      // Test alternative name used in context
      expect(classifyPosition('RawMaterial', 'GL')).toBe('indirect');
      expect(classifyPosition('RawMaterial', 'TL')).toBe('indirect');
      expect(classifyPosition('RawMaterial', 'TM')).toBe('indirect');
    });

    test('Sub Material department should be OH', () => {
      expect(classifyPosition('Sub Material', 'GL')).toBe('OH');
      expect(classifyPosition('Sub Material', 'TL')).toBe('OH');
      expect(classifyPosition('Sub Material', 'TM')).toBe('OH');
      
      // Test alternative name used in context
      expect(classifyPosition('SubMaterial', 'GL')).toBe('OH');
      expect(classifyPosition('SubMaterial', 'TL')).toBe('OH');
      expect(classifyPosition('SubMaterial', 'TM')).toBe('OH');
    });

    test('Market departments should be indirect', () => {
      expect(classifyPosition('ACC Market', 'TM')).toBe('indirect');
      expect(classifyPosition('P&L Market', 'TM')).toBe('indirect');
      expect(classifyPosition('Bottom Market', 'TM')).toBe('indirect');
      
      // Test alternative names used in context
      expect(classifyPosition('ACC', 'TM')).toBe('indirect');
      expect(classifyPosition('PL', 'TM')).toBe('indirect');
      expect(classifyPosition('BottomMarket', 'TM')).toBe('indirect');
    });

    test('Plant Production department classifications', () => {
      expect(classifyPosition('Plant Production', 'GL')).toBe('indirect');
      expect(classifyPosition('Plant Production', 'TL')).toBe('indirect');
      expect(classifyPosition('Plant Production', 'TM')).toBe('direct');
      
      // Test department names with line breaks (like "Plant Production\n(Outsole degreasing)")
      expect(classifyPosition('Plant Production\n(Outsole degreasing)', 'GL')).toBe('indirect');
      expect(classifyPosition('Plant Production\n(Outsole degreasing)', 'TL')).toBe('indirect');
      expect(classifyPosition('Plant Production\n(Outsole degreasing)', 'TM')).toBe('direct');
    });

    test('FG WH department should be indirect', () => {
      expect(classifyPosition('FG WH', 'GL')).toBe('indirect');
      expect(classifyPosition('FG WH', 'TL')).toBe('indirect');
      expect(classifyPosition('FG WH', 'TM')).toBe('indirect');
      
      // Test alternative name used in context
      expect(classifyPosition('FGWH', 'GL')).toBe('indirect');
      expect(classifyPosition('FGWH', 'TL')).toBe('indirect');
      expect(classifyPosition('FGWH', 'TM')).toBe('indirect');
    });

    test('Support departments should be OH', () => {
      expect(classifyPosition('TPM', 'GL')).toBe('OH');
      expect(classifyPosition('CQM', 'GL')).toBe('OH');
      expect(classifyPosition('Lean', 'GL')).toBe('OH');
      expect(classifyPosition('Security', 'TM')).toBe('OH');
      expect(classifyPosition('RMCC', 'TM')).toBe('OH');
    });

    test('Separated process departments should be indirect', () => {
      expect(classifyPosition('No-sew', 'GL')).toBe('indirect');
      expect(classifyPosition('No-sew', 'TL')).toBe('indirect');
      expect(classifyPosition('No-sew', 'TM')).toBe('indirect');
      
      expect(classifyPosition('HF Welding', 'GL')).toBe('indirect');
      expect(classifyPosition('HF Welding', 'TL')).toBe('indirect');
      expect(classifyPosition('HF Welding', 'TM')).toBe('indirect');
    });

    test('Separated department should be indirect (for blank positions)', () => {
      expect(classifyPosition('Separated', 'GL')).toBe('indirect');
      expect(classifyPosition('Separated', 'TL')).toBe('indirect');
      expect(classifyPosition('Separated', 'TM')).toBe('indirect');
    });
  });

  describe('Exception rules', () => {
    test('CE TM Mixing should be direct', () => {
      const position: Position = {
        id: 'ce-tm-mixing',
        department: 'CE',
        level: 'TM',
        title: 'CE TM Mixing',
        subtitle: 'Mixing',
        source: 'page1'
      };
      
      expect(engine.classifyPositionObject(position)).toBe('direct');
    });

    test('FG WH TM Shipping should be OH', () => {
      const position: Position = {
        id: 'fgwh-tm-shipping',
        department: 'FG WH',
        level: 'TM',
        title: 'FG WH TM Shipping',
        subtitle: 'Shipping',
        source: 'page1'
      };
      
      expect(engine.classifyPositionObject(position)).toBe('OH');
      
      // Test alternative department name (should be normalized)
      const positionAlt: Position = {
        id: 'fgwh-tm-shipping-alt',
        department: 'FGWH',
        level: 'TM',
        title: 'FGWH TM Shipping',
        subtitle: 'Shipping',
        source: 'page1'
      };
      
      expect(engine.classifyPositionObject(positionAlt)).toBe('OH');
    });

    test('No-sew process positions should be indirect', () => {
      const position: Position = {
        id: 'nosew-gl',
        department: 'Line',
        level: 'GL',
        title: 'No-sew GL',
        processType: 'No-sew',
        source: 'separated'
      };
      
      expect(engine.classifyPositionObject(position)).toBe('indirect');
      
      // Test No-sew as department name
      const positionDept: Position = {
        id: 'nosew-dept',
        department: 'No-sew',
        level: 'TM',
        title: 'No-sew TM',
        source: 'separated'
      };
      
      expect(engine.classifyPositionObject(positionDept)).toBe('indirect');
    });

    test('HF Welding process positions should be indirect', () => {
      const position: Position = {
        id: 'hf-welding-gl',
        department: 'Line',
        level: 'GL',
        title: 'HF Welding GL',
        processType: 'HF Welding',
        source: 'separated'
      };
      
      expect(engine.classifyPositionObject(position)).toBe('indirect');
      
      // Test HF Welding as department name
      const positionDept: Position = {
        id: 'hf-welding-dept',
        department: 'HF Welding',
        level: 'TL',
        title: 'HF Welding TL',
        source: 'separated'
      };
      
      expect(engine.classifyPositionObject(positionDept)).toBe('indirect');
    });
  });

  describe('Process-specific rules', () => {
    test('No-sew process should be indirect', () => {
      expect(classifyPosition('Line', 'TM', 'No-sew')).toBe('indirect');
    });

    test('HF Welding process should be indirect', () => {
      expect(classifyPosition('Line', 'TM', 'HF Welding')).toBe('indirect');
    });
  });

  describe('Validation', () => {
    test('should validate position with all required fields', () => {
      const position: Position = {
        id: 'test-position',
        department: 'Line',
        level: 'TM',
        title: 'Test Position',
        source: 'page1'
      };

      const result = validatePosition(position);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should report errors for missing required fields', () => {
      const position: Position = {
        id: 'test-position',
        department: '',
        level: 'TM',
        title: 'Test Position',
        source: 'page1'
      };

      const result = validatePosition(position);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Position department is required');
    });

    test('should report warnings for classification mismatches', () => {
      const position: Position = {
        id: 'test-position',
        department: 'Line',
        level: 'VSM',
        title: 'Test Position',
        classification: 'direct', // Should be OH
        source: 'page1'
      };

      const result = validatePosition(position);
      expect(result.warnings).toContain(
        'Position classification mismatch: expected OH, got direct'
      );
    });
  });

  describe('Department name variations', () => {
    test('should handle alternative department names consistently', () => {
      // Material departments
      expect(classifyPosition('Raw Material', 'TM')).toBe(classifyPosition('RawMaterial', 'TM'));
      expect(classifyPosition('Sub Material', 'TM')).toBe(classifyPosition('SubMaterial', 'TM'));
      
      // Market departments
      expect(classifyPosition('ACC Market', 'TM')).toBe(classifyPosition('ACC', 'TM'));
      expect(classifyPosition('P&L Market', 'TM')).toBe(classifyPosition('PL', 'TM'));
      expect(classifyPosition('Bottom Market', 'TM')).toBe(classifyPosition('BottomMarket', 'TM'));
      
      // Warehouse departments
      expect(classifyPosition('FG WH', 'TM')).toBe(classifyPosition('FGWH', 'TM'));
    });

    test('should classify all department variations correctly', () => {
      // Test that all variations produce expected results
      expect(classifyPosition('RawMaterial', 'TM')).toBe('indirect');
      expect(classifyPosition('SubMaterial', 'TM')).toBe('OH');
      expect(classifyPosition('ACC', 'TM')).toBe('indirect');
      expect(classifyPosition('PL', 'TM')).toBe('indirect');
      expect(classifyPosition('BottomMarket', 'TM')).toBe('indirect');
      expect(classifyPosition('FGWH', 'TM')).toBe('indirect');
    });
  });

  describe('Edge cases and fallbacks', () => {
    test('should fallback to indirect for unknown departments', () => {
      expect(classifyPosition('Unknown Department', 'TM')).toBe('indirect');
    });

    test('should handle empty strings gracefully', () => {
      expect(classifyPosition('', 'TM')).toBe('indirect');
    });

    test('should prioritize exception rules over department rules', () => {
      // CE TM normally would be direct, but Mixing exception should override
      const position: Position = {
        id: 'ce-tm-mixing',
        department: 'CE',
        level: 'TM',
        title: 'CE TM',
        subtitle: 'Mixing Operations',
        source: 'page1'
      };
      
      expect(engine.classifyPositionObject(position)).toBe('direct');
    });

    test('should prioritize level rules over department rules', () => {
      // CE department TM is normally direct, but PM level should be OH
      expect(classifyPosition('CE', 'PM')).toBe('OH');
    });
  });

  describe('Comprehensive rule coverage', () => {
    test('should have rules for all known departments', () => {
      const knownDepartments = [
        'Line', 'Admin', 'Small Tooling', 'Quality', 'CE', 'TPM', 'CQM', 'Lean', 'Security', 'RMCC',
        'Raw Material', 'RawMaterial', 'Sub Material', 'SubMaterial',
        'ACC Market', 'ACC', 'P&L Market', 'PL', 'Bottom Market', 'BottomMarket',
        'FG WH', 'FGWH', 'Plant Production',
        'No-sew', 'HF Welding', 'Separated'
      ];

      knownDepartments.forEach(dept => {
        const classification = classifyPosition(dept, 'TM');
        expect(['direct', 'indirect', 'OH']).toContain(classification);
      });
    });

    test('should apply level overrides consistently across all departments', () => {
      const testDepartments = ['Line', 'Quality', 'CE', 'Admin', 'Raw Material', 'ACC'];
      
      testDepartments.forEach(dept => {
        expect(classifyPosition(dept, 'PM')).toBe('OH');
        expect(classifyPosition(dept, 'LM')).toBe('OH');
      });
    });

    test('should handle all exception cases correctly', () => {
      // CE TM Mixing
      const ceMixing: Position = {
        id: 'ce-mixing',
        department: 'CE',
        level: 'TM',
        title: 'CE TM Mixing',
        subtitle: 'Mixing',
        source: 'page1'
      };
      expect(engine.classifyPositionObject(ceMixing)).toBe('direct');

      // FG WH TM Shipping
      const fgwhShipping: Position = {
        id: 'fgwh-shipping',
        department: 'FG WH',
        level: 'TM',
        title: 'FG WH TM Shipping',
        subtitle: 'Shipping',
        source: 'page1'
      };
      expect(engine.classifyPositionObject(fgwhShipping)).toBe('OH');

      // Process-based exceptions
      expect(classifyPosition('Line', 'TM', 'No-sew')).toBe('indirect');
      expect(classifyPosition('Line', 'TM', 'HF Welding')).toBe('indirect');
    });
  });

  describe('Rule management', () => {
    test('should return classification rules', () => {
      const rules = engine.getClassificationRules();
      expect(rules.departmentRules).toBeDefined();
      expect(rules.levelRules).toBeDefined();
      expect(rules.processRules).toBeDefined();
      expect(rules.exceptionRules).toBeDefined();
    });

    test('should allow rule updates', () => {
      const newRules = {
        departmentRules: {
          'Test Department': {
            defaultClassification: 'direct' as const
          }
        }
      };

      engine.updateRules(newRules);
      expect(engine.classifyPosition('Test Department', 'TM')).toBe('direct');
    });
  });
});

describe('Utility functions', () => {
  test('classifyPosition utility should work correctly', () => {
    expect(classifyPosition('Line', 'PM')).toBe('OH');
    expect(classifyPosition('CE', 'TM')).toBe('OH'); // Default CE TM is OH, only Mixing is direct
    expect(classifyPosition('Quality', 'GL')).toBe('OH');
  });

  test('validatePosition utility should work correctly', () => {
    const position: Position = {
      id: 'test',
      department: 'Line',
      level: 'TM',
      title: 'Test',
      source: 'page1'
    };

    const result = validatePosition(position);
    expect(result.isValid).toBe(true);
  });
});

  describe('Department name normalization', () => {
    test('should classify positions with legacy department names correctly', () => {
      // Test that legacy names get normalized and classified correctly
      expect(classifyPosition('RawMaterial', 'TM')).toBe('indirect');
      expect(classifyPosition('SubMaterial', 'TM')).toBe('OH');
      expect(classifyPosition('BottomMarket', 'TM')).toBe('indirect');
      expect(classifyPosition('FGWH', 'TM')).toBe('indirect');
      expect(classifyPosition('ACC', 'TM')).toBe('indirect');
      expect(classifyPosition('PL', 'TM')).toBe('indirect');
      
      // Should produce same results as normalized names
      expect(classifyPosition('RawMaterial', 'TM')).toBe(classifyPosition('Raw Material', 'TM'));
      expect(classifyPosition('SubMaterial', 'TM')).toBe(classifyPosition('Sub Material', 'TM'));
      expect(classifyPosition('BottomMarket', 'TM')).toBe(classifyPosition('Bottom Market', 'TM'));
      expect(classifyPosition('FGWH', 'TM')).toBe(classifyPosition('FG WH', 'TM'));
      expect(classifyPosition('ACC', 'TM')).toBe(classifyPosition('ACC Market', 'TM'));
      expect(classifyPosition('PL', 'TM')).toBe(classifyPosition('P&L Market', 'TM'));
    });
  });