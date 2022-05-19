/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

import { AssertTypeMatchesExpected, Expected } from '../../src';

describe('typings', () => {
  describe('matching ok ..', () => {
    test('expecting [any] type', () => {
      type Expected = any;
      type RealType = any;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });

    test('expecting [unknown] type (case 1)', () => {
      type Expected = unknown;
      type RealType = unknown;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });

    test('expecting [unknown] type (case 2)', () => {
      type Expected = unknown;
      type RealType = any;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });

    test('expecting [never] type', () => {
      type Expected = never;
      type RealType = never;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });

    test('str literal type', () => {
      type Expected = 'abc';
      type RealType = 'abc';
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });    
 
    test('primitive type (case 1)', () => {
      type Expected = boolean;
      type RealType = boolean;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });

    test('primitive type (case 2)', () => {
      type Expected = boolean;
      type RealType = true | false;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });

    test('primitive type (case 3)', () => {
      type Expected = number;
      type RealType = number;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });

    test('union type', () => {
      type Expected = 'a' | 'b';
      type RealType = 'b' | 'a';
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });
  
    test('object type', () => {
      type Expected = { n: number, a: [string, number], d: { s: string } };
      type RealType = { n: number, a: [string, number], d: { s: string } };
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });
  
    test('array type (case 1)', () => {
      type Expected = [string, number];
      type RealType = [string, number];
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });

    test('array type (case 2)', () => {
      type Expected = string[];
      type RealType = string[];
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });

    test('array type (case 3)', () => {
      type Expected = (string | number)[];
      type RealType = (number | string)[];
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });
  
    test('function type (case 1)', () => {
      type Expected = (n: number, s: string) => {x: boolean, y: number};
      type RealType = (n: number, s: string) => {x: boolean, y: number};
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });
  
    test('function type (case 2)', () => {
      type Expected = (n: number) => boolean;
      type RealType = (x: number) => boolean;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignmentShouldPass;
      expect(result).toBeDefined();
    });
  })
});
