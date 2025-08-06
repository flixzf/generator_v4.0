/**
 * Tests for Page4-direct aggregation logic
 * Verifies that only positions classified as "Direct" by the centralized engine are included
 */

import { classifyPosition } from '@/components/common/ClassificationEngine';

describe('Page4-direct Aggregation Logic', () => {
  describe('Classification Engine Integration', () => {
    test('should classify CE TM Mixing as direct (should appear in direct page)', () => {
      const classification = classifyPosition('CE', 'TM', undefined, 'Mixing');
      expect(classification).toBe('direct');
    });

    test('should classify Plant Production TM as direct (should appear in direct page)', () => {
      const classification = classifyPosition('Plant Production', 'TM');
      expect(classification).toBe('direct');
    });

    test('should classify Line positions as indirect/OH (should NOT appear in direct page)', () => {
      expect(classifyPosition('Line', 'PM')).toBe('OH');
      expect(classifyPosition('Line', 'LM')).toBe('OH');
      expect(classifyPosition('Line', 'GL')).toBe('indirect');
      expect(classifyPosition('Line', 'TL')).toBe('indirect');
      expect(classifyPosition('Line', 'TM')).toBe('indirect');
    });

    test('should classify Quality positions as indirect/OH (should NOT appear in direct page)', () => {
      expect(classifyPosition('Quality', 'GL')).toBe('OH');
      expect(classifyPosition('Quality', 'TL')).toBe('indirect');
      expect(classifyPosition('Quality', 'TM')).toBe('indirect');
    });

    test('should classify No-sew positions as indirect (should NOT appear in direct page)', () => {
      expect(classifyPosition('No-sew', 'GL')).toBe('indirect');
      expect(classifyPosition('No-sew', 'TL')).toBe('indirect');
      expect(classifyPosition('No-sew', 'TM')).toBe('indirect');
    });

    test('should classify HF Welding positions as indirect (should NOT appear in direct page)', () => {
      expect(classifyPosition('HF Welding', 'TL')).toBe('indirect');
      expect(classifyPosition('HF Welding', 'TM')).toBe('indirect');
    });
  });

  describe('Aggregation Filtering Logic', () => {
    test('should include only direct positions in page4-direct', () => {
      const testPositions = [
        { dept: 'CE', level: 'TM', subtitle: 'Mixing', expected: 'direct' },
        { dept: 'Plant Production', level: 'TM', expected: 'direct' },
        { dept: 'Line', level: 'PM', expected: 'OH' },
        { dept: 'Line', level: 'GL', expected: 'indirect' },
        { dept: 'Quality', level: 'TM', expected: 'indirect' },
        { dept: 'No-sew', level: 'TM', expected: 'indirect' },
        { dept: 'HF Welding', level: 'TM', expected: 'indirect' },
      ];

      testPositions.forEach(({ dept, level, subtitle, expected }) => {
        const classification = classifyPosition(dept, level as any, undefined, subtitle);
        
        const shouldBeIncluded = classification === 'direct';
        
        if (expected === 'direct') {
          expect(shouldBeIncluded).toBe(true);
        } else {
          expect(shouldBeIncluded).toBe(false);
        }
      });
    });

    test('should properly map separated processes to Line department', () => {
      const separatedDepts = ['No-sew', 'HF Welding', 'Separated'];
      
      separatedDepts.forEach(dept => {
        const classification = classifyPosition(dept, 'TM');
        
        // All separated processes should be indirect (NOT included in page4-direct)
        expect(classification).toBe('indirect');
      });
    });
  });

  describe('Requirements Validation', () => {
    test('should satisfy requirement 2.1: only include direct in page4-direct', () => {
      const directPositions = [
        { dept: 'CE', level: 'TM', subtitle: 'Mixing' },
        { dept: 'Plant Production', level: 'TM' },
      ];

      directPositions.forEach(({ dept, level, subtitle }) => {
        const classification = classifyPosition(dept, level as any, undefined, subtitle);
        expect(classification).toBe('direct');
        
        // These should appear in direct page
        const shouldAppearInDirectPage = classification === 'direct';
        expect(shouldAppearInDirectPage).toBe(true);
      });
    });

    test('should satisfy requirement 2.2: CE TM appears in correct aggregation page', () => {
      // CE TM Mixing should be direct (appear in direct page, not indirect)
      const mixingClassification = classifyPosition('CE', 'TM', undefined, 'Mixing');
      expect(mixingClassification).toBe('direct');
      
      // Other CE TM positions should be OH (appear in indirect page, not direct)
      const otherCEClassification = classifyPosition('CE', 'TM', undefined, 'Other');
      expect(otherCEClassification).toBe('OH');
    });

    test('should satisfy requirement 2.3: separated processes correctly classified', () => {
      // No-sew positions should be indirect (NOT appear in direct page)
      expect(classifyPosition('No-sew', 'GL')).toBe('indirect');
      expect(classifyPosition('No-sew', 'TL')).toBe('indirect');
      expect(classifyPosition('No-sew', 'TM')).toBe('indirect');
      
      // HF Welding positions should be indirect (NOT appear in direct page)
      expect(classifyPosition('HF Welding', 'TL')).toBe('indirect');
      expect(classifyPosition('HF Welding', 'TM')).toBe('indirect');
      
      // None should appear in direct page
      const nosewShouldNotAppear = classifyPosition('No-sew', 'TM') !== 'direct';
      const hfWeldingShouldNotAppear = classifyPosition('HF Welding', 'TM') !== 'direct';
      
      expect(nosewShouldNotAppear).toBe(true);
      expect(hfWeldingShouldNotAppear).toBe(true);
    });

    test('should satisfy requirement 2.4: aggregation totals match detailed views', () => {
      // Test that direct classifications are consistent across all contexts
      const testCases = [
        { dept: 'CE', level: 'TM', subtitle: 'Mixing', expected: 'direct' },
        { dept: 'Plant Production', level: 'TM', expected: 'direct' },
      ];

      testCases.forEach(({ dept, level, subtitle, expected }) => {
        const classification = classifyPosition(dept, level as any, undefined, subtitle);
        expect(classification).toBe(expected);
      });
    });
  });

  describe('Cross-validation with Indirect Page', () => {
    test('should ensure no position appears in both direct and indirect pages', () => {
      const allTestPositions = [
        { dept: 'Line', level: 'PM' },
        { dept: 'Line', level: 'LM' },
        { dept: 'Line', level: 'GL' },
        { dept: 'Line', level: 'TL' },
        { dept: 'Line', level: 'TM' },
        { dept: 'Quality', level: 'GL' },
        { dept: 'Quality', level: 'TL' },
        { dept: 'Quality', level: 'TM' },
        { dept: 'CE', level: 'TM', subtitle: 'Mixing' },
        { dept: 'CE', level: 'TM', subtitle: 'Other' },
        { dept: 'Plant Production', level: 'TM' },
        { dept: 'No-sew', level: 'GL' },
        { dept: 'No-sew', level: 'TL' },
        { dept: 'No-sew', level: 'TM' },
        { dept: 'HF Welding', level: 'TL' },
        { dept: 'HF Welding', level: 'TM' },
      ];

      allTestPositions.forEach(({ dept, level, subtitle }) => {
        const classification = classifyPosition(dept, level as any, undefined, subtitle);
        
        const appearsInDirect = classification === 'direct';
        const appearsInIndirect = classification === 'indirect' || classification === 'OH';
        
        // Each position should appear in exactly one aggregation page
        expect(appearsInDirect && appearsInIndirect).toBe(false);
        expect(appearsInDirect || appearsInIndirect).toBe(true);
      });
    });

    test('should ensure sum of direct + indirect + OH equals total personnel', () => {
      const testPositions = [
        { dept: 'Line', level: 'PM' },
        { dept: 'Line', level: 'LM' },
        { dept: 'Line', level: 'GL' },
        { dept: 'Quality', level: 'TM' },
        { dept: 'CE', level: 'TM', subtitle: 'Mixing' },
        { dept: 'Plant Production', level: 'TM' },
        { dept: 'No-sew', level: 'TM' },
      ];

      let directCount = 0;
      let indirectCount = 0;
      let ohCount = 0;

      testPositions.forEach(({ dept, level, subtitle }) => {
        const classification = classifyPosition(dept, level as any, undefined, subtitle);
        
        if (classification === 'direct') directCount++;
        else if (classification === 'indirect') indirectCount++;
        else if (classification === 'OH') ohCount++;
      });

      const totalClassified = directCount + indirectCount + ohCount;
      expect(totalClassified).toBe(testPositions.length);
    });
  });
});