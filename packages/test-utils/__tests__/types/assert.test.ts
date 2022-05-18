/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

import { AssertTypeMatchesExpected, Expected } from '../../src';

describe('typings', () => {
  describe('matching ok ..', () => {
    test('primitive type', () => {
      type Expected = boolean;
      type RealType = boolean;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });

    test('union type', () => {
      type Expected = 'a' | 'b';
      type RealType = 'b' | 'a';
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });
  
    test('object type', () => {
      type Expected = { n: number, a: [string, number], d: { s: string } };
      type RealType = { n: number, a: [string, number], d: { s: string } };
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });
  
    test('array type', () => {
      type Expected = [string, number];
      type RealType = [string, number];
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });
  
    test('function type (case 1)', () => {
      type Expected = (n: number) => boolean;
      type RealType = (n: number) => boolean;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });
  
    test('function type (case 2)', () => {
      type Expected = (n: number) => boolean;
      type RealType = (x: number) => boolean;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });
  })

  describe('matching "ok" (but non strictly)', () => {
    test('[any] matches any type -- [NOT DESIRED] (but, not an expected test case)', () => {
      type Expected = any;
      type RealType = boolean;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });

    test('primitive type (case 1) -- [NOT DESIRED]', () => {
      type Expected = string;
      type RealType = 'abc'; // not full expected type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });

    test('primitive type (case 2) -- [NOT DESIRED]', () => {
      type Expected = boolean;
      type RealType = true; // not full expected type [missing false]
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });

    test('union type (case 1)', () => {
      type Expected = 'a' | 'c';
      type RealType = 'a' | 'b' | 'c'; // got full expected type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });

    test('union type (case 2) -- [NOT DESIRED]', () => {
      type Expected = 'a' | 'b';
      type RealType = 'b'; // not full expected type [missing 'a']
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });

    test('union type (case 3) -- [NOT DESIRED]', () => {
      type Expected = 'a' | 'b';
      type RealType = 'x' | 'y' | 'b'; // not full expected type [missing 'a']
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });
  
    test('object type (case 1)', () => {
      type Expected = {};
      type RealType = { n: number }; // got full expected type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });
  
    test('object type (case 2)', () => {
      type Expected = { a: [string, number] };
      type RealType = { n: number, a: [string, number], d: { s: string } }; // got full expected type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });
  
    test('array type (case 1) -- [NOT DESIRED]', () => {
      type Expected = [string, number, boolean];
      type RealType = ['a', 10, false]; // not full array element type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });
  
    test('array type (case 2) -- [NOT DESIRED]', () => {
      type Expected = string[];
      type RealType = any[]; // unexpected [any] in array element type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });
  
    test('function type (case 1)', () => {
      type Expected = (s: 'a' | 'c') => boolean;
      type RealType = (s: 'a' | 'b' | 'c') => boolean; // got full param type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });

    test('function type (case 2) -- [NOT DESIRED]', () => {
      type Expected = (s: string) => boolean;
      type RealType = (s: string) => true; // not full return type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });

    test('function type (case 3) -- [NOT DESIRED]', () => {
      type Expected = (n: number, o: { s: string }) => boolean;
      type RealType = (n: number) => boolean; // not full params list
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });
  })

  describe('not expecting [any] matching..', () => {
    type RealType = any;

    test('primitive type', () => {
      type Expected = boolean;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });

    test('union type', () => {
      type Expected = 'a' | 'b';
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('object type', () => {
      type Expected = { a: number };
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('array type (case 1)', () => {
      type Expected = [];
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('array type (case 2)', () => {
      type Expected = any[];
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('function type', () => {
      type Expected = (n: number) => boolean;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  })

  describe('not expecting [unknown] matching..', () => {
    type RealType = unknown;

    test('primitive type', () => {
      type Expected = boolean;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });

    test('union type', () => {
      type Expected = 'a' | 'b';
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('object type', () => {
      type Expected = { a: number };
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('array type', () => {
      type Expected = [];
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('function type', () => {
      type Expected = (n: number) => boolean;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  })

  describe('not expecting [never] matching..', () => {
    type RealType = never;

    test('primitive type', () => {
      type Expected = boolean;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });

    test('union type', () => {
      type Expected = 'a' | 'b';
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('object type', () => {
      type Expected = { a: number };
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('array type', () => {
      type Expected = [];
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('function type', () => {
      type Expected = (n: number) => boolean;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  })

  describe('not matching ..', () => {
    test('primitive type (case 1)', () => {
      type Expected = boolean;
      type RealType = string;
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });

    test('primitive type (case 2) -- [Match NOT DESIRED]', () => {
      type Expected = string;
      type RealType = 'abc'; // not full expected type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });

    test('primitive type (case 3) -- [Match NOT DESIRED]', () => {
      type Expected = boolean;
      type RealType = true; // not full expected type [missing false]
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });    

    test('union type (case 1)', () => {
      type Expected = 'a' | 'b';
      type RealType = 'x' | 'y';
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });

    test('union type (case 2) -- [Match NOT DESIRED]', () => {
      type Expected = 'a' | 'b';
      type RealType = 'b'; // not full expected type [missing 'a']
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });

    test('union type (case 3) -- [Match NOT DESIRED]', () => {
      type Expected = 'a' | 'b';
      type RealType = 'x' | 'y' | 'b'; // not full expected type [missing 'a']
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });

    test('object type (case 1)', () => {
      type Expected = { n: number };
      type RealType = {}; // missing prop [n: number]
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('object type (case 2)', () => {
      type Expected = { n: number, a: [string, number], d: { s: string } };
      type RealType = { n: string, a: [string, number], d: { s: string } }; // missing prop [n: number]
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('object type (case 3)', () => {
      type Expected = { n: number, a: [string, number], d: { x: string } };
      type RealType = { n: number, a: [string, number], d: { s: string } }; // missing prop [d.x: string]
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('array type (case 1)', () => {
      type Expected = [];
      type RealType = [string, number];
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('array type (case 2)', () => {
      type Expected = [string, number];
      type RealType = [];
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('array type (case 3)', () => {
      type Expected = [number, string];
      type RealType = [number];
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('array type (case 4)', () => {
      type Expected = [number];
      type RealType = [number, string];
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('array type (case 5)', () => {
      type Expected = [string, number];
      type RealType = [number, string];
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('array type (case 6) -- [Match NOT DESIRED]', () => {
      type Expected = string[];
      type RealType = any[]; // unexpected [any] in array element type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });

    test('array type (case 7) -- [Match NOT DESIRED]', () => {
      type Expected = [string, number, boolean];
      type RealType = ['a', 10, false]; // not full array element type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });
  
    test('function type (case 1)', () => {
      type Expected = (n: number) => boolean;
      type RealType = (n: number) => string; // diff return type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('function type (case 2)', () => {
      type Expected = (n: number) => boolean;
      type RealType = (n: string) => boolean; // diff param type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('function type (case 3)', () => {
      type Expected = (n: number, o: { s: string }) => boolean;
      type RealType = (n: number, o: { x: string }) => boolean; // diff param type [missing o.s: string]
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldFailed;
      expect(result).toBeDefined();
    });
  
    test('function type (case 4) -- [Match NOT DESIRED]', () => {
      type Expected = (n: number, o: { s: string }) => boolean;
      type RealType = (n: number) => boolean; // not full params list
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });

    test('function type (case 5) -- [Match NOT DESIRED]', () => {
      type Expected = (s: string) => boolean;
      type RealType = (s: string) => true; // not full return type
      const result: AssertTypeMatchesExpected<
        RealType,
        Expected
      > = Expected.assignShouldPassed;
      expect(result).toBeDefined();
    });
  })
});
