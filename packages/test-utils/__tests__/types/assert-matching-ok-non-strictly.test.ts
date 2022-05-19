/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

import { AssertTypeMatchesExpected, Expected } from '../../src';

describe('typings', () => {
  describe('matching "ok" (but non strictly)', () => {
    test('union type (case 1)', () => {
      type Expected = 'a' | 'c';
      type RealType = 'a' | 'b' | 'c'; // got full expected type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });

    test('object type (case 1)', () => {
      type Expected = {};
      type RealType = { n: number }; // got full expected type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });
  
    test('object type (case 2)', () => {
      type Expected = { a: [string, number] };
      type RealType = { n: number, a: [string, number], d: { s: string } }; // got full expected type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });
  
    test('function type (case 1)', () => {
      type Expected = (s: 'a' | 'c') => boolean;
      type RealType = (s: 'a' | 'b' | 'c') => boolean; // got full param type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });

    test('function type (case 2)', () => {
      type Expected = (n: number, s: string) => {x: boolean};
      type RealType = (n: number, s: string) => {x: boolean, y: number}; // got full return type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });    

    test('function type (case 3)', () => {
      type Expected = (n: number, s: string) => 'a' | 'b';
      type RealType = (n: number, s: string) => 'x' | 'b' | 'a'; // got full return type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    }); 
  })
});
