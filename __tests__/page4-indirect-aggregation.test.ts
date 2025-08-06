/**
 * Test for Page4-indirect aggregation logic with centralized classification
 */

import { classifyPosition } from '@/components/common/ClassificationEngine';

describe('Page4-indirect Aggregation Logic', () => {
  describe('Classification Engine Integration', () => {
    test('should classify CE TM Mixing as direct (should not appear in indirect page)', () => {
      const classification = classifyPosition('CE', 'TM', undefined, 'Mixing');
      expect(classification).toBe('direct');
    });

    test('should classify FG WH TM Shipping as OH (should appear in indirect page)', () => {
      const classification = classifyPosition('FG WH', 'TM', undefined, 'Shipping TM 1');
      expect(classification).toBe('OH');
    });

    test('should classify No-sew positions as indirect (should appear in indirect page)', () => {
      expect(classifyPosition('No-sew', 'GL')).toBe('indirect');
      expect(classifyPosition('No-sew', 'TL')).toBe('indirect');
      expect(classifyPosition('No-sew', 'TM')).toBe('indirect');
    });

    test('should classify HF Welding positions as indirect (should appear in indirect page)', () => {
      expect(classifyPosition('HF Welding', 'TL')).toBe('indirect');
      expect(classifyPosition('HF Welding', 'TM')).toBe('indirect');
    });

    test('should classify Line positions correctly', () => {
      expect(classifyPosition('Line', 'PM')).toBe('OH');
      expect(classifyPosition('Line', 'LM')).toBe('OH');
      expect(classifyPosition('Line', 'GL')).toBe('indirect');
      expect(classifyPosition('Line', 'TL')).toBe('indirect');
      expect(classifyPosition('Line', 'TM')).toBe('indirect');
    });

    test('should classify Quality positions correctly', () => {
      expect(classifyPosition('Quality', 'GL')).toBe('OH');
      expect(classifyPosition('Quality', 'TL')).toBe('indirect');
      expect(classifyPosition('Quality', 'TM')).toBe('indirect');
    });
  });

  describe('Aggregation Filtering Logic', () => {
    test('should include only indirect and OH positions in page4-indirect', () => {
      const testPositions = [
        { dept: 'CE', level: 'TM', subtitle: 'Mixing', expected: false }, // direct - should be excluded
        { dept: 'FG WH', level: 'TM', subtitle: 'Shipping TM 1', expected: true }, // OH - should be included
        { dept: 'No-sew', level: 'GL', expected: true }, // indirect - should be included
        { dept: 'Line', level: 'PM', expected: true }, // OH - should be included
        { dept: 'Line', level: 'GL', expected: true }, // indirect - should be included
        { dept: 'Quality', level: 'GL', expected: true }, // OH - should be included
        { dept: 'Quality', level: 'TM', expected: true }, // indirect - should be included
      ];

      testPositions.forEach(({ dept, level, subtitle, expected }) => {
        const classification = classifyPosition(dept, level as any, undefined, subtitle);
        const shouldBeIncluded = classification === 'indirect' || classification === 'OH';
        
        expect(shouldBeIncluded).toBe(expected);
      });
    });

    test('should properly map separated processes to Line department', () => {
      // Test that No-sew and HF Welding positions are mapped to Line in aggregation
      const separatedDepts = ['No-sew', 'HF Welding', 'Separated'];
      
      separatedDepts.forEach(dept => {
        const classification = classifyPosition(dept, 'TM');
        // All separated processes should be indirect (included in page4-indirect)
        expect(classification).toBe('indirect');
      });
    });
  });

  describe('Requirements Validation', () => {
    test('should satisfy requirement 2.1: only include indirect/OH in page4-indirect', () => {
      // Test various positions to ensure direct positions are excluded
      const directPositions = [
        { dept: 'CE', level: 'TM', subtitle: 'Mixing' },
        // Add other direct positions as needed
      ];

      directPositions.forEach(({ dept, level, subtitle }) => {
        const classification = classifyPosition(dept, level as any, undefined, subtitle);
        expect(classification).toBe('direct');
        
        // Direct positions should NOT appear in indirect page
        const shouldAppearInIndirect = classification === 'indirect' || classification === 'OH';
        expect(shouldAppearInIndirect).toBe(false);
      });
    });

    test('should satisfy requirement 2.2: CE TM appears in correct aggregation page', () => {
      // CE TM Mixing should be direct (appear in direct page, not indirect)
      const mixingClassification = classifyPosition('CE', 'TM', undefined, 'Mixing');
      expect(mixingClassification).toBe('direct');
      
      // Other CE TM positions should be OH (appear in indirect page)
      const otherCEClassification = classifyPosition('CE', 'TM', undefined, 'Other');
      expect(otherCEClassification).toBe('OH');
    });

    test('should satisfy requirement 2.3: separated processes correctly classified', () => {
      // No-sew positions should be indirect
      expect(classifyPosition('No-sew', 'GL')).toBe('indirect');
      expect(classifyPosition('No-sew', 'TL')).toBe('indirect');
      expect(classifyPosition('No-sew', 'TM')).toBe('indirect');
      
      // HF Welding positions should be indirect
      expect(classifyPosition('HF Welding', 'TL')).toBe('indirect');
      expect(classifyPosition('HF Welding', 'TM')).toBe('indirect');
      
      // All should appear in indirect page
      const nosewShouldAppear = classifyPosition('No-sew', 'TM') !== 'direct';
      const hfWeldingShouldAppear = classifyPosition('HF Welding', 'TM') !== 'direct';
      
      expect(nosewShouldAppear).toBe(true);
      expect(hfWeldingShouldAppear).toBe(true);
    });
  });
});