/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

import { AssertTypeMatchesExpected, Expected } from '@claritale/test-utils';
import {
  Scenario, // eslint-disable-line @typescript-eslint/no-unused-vars
  AnyTypesMap,
  IdsTypeMap,
  L_IdNamesTuple,
  L_Ids,
  L_Regex,
  SplittedThat,
  StepsMetaMap,
} from '../../src';

describe('typings', () => {
  test('can assert on types', () => {
    type Test01Expected = boolean;
    type Test01RealType = boolean;
    const test01Result: AssertTypeMatchesExpected<
      Test01RealType,
      Test01Expected
    > = Expected.assignShouldPassed;
    expect(test01Result).toBeDefined();
    // ------------------------------------------------------------
    type Test02Expected = boolean;
    type Test02RealType = any;
    const test02Result: AssertTypeMatchesExpected<
      Test02RealType,
      Test02Expected
    > = Expected.assignShouldFailed;
    expect(test02Result).toBeDefined();
    // ------------------------------------------------------------
    type Test03Expected = {};
    type Test03RealType = { a: number };
    const test03Result: AssertTypeMatchesExpected<
      Test03RealType,
      Test03Expected
    > = Expected.assignShouldPassed;
    expect(test03Result).toBeDefined();
    // ------------------------------------------------------------
    type Test04Expected = { a: number };
    type Test04RealType = {};
    const test04Result: AssertTypeMatchesExpected<
      Test04RealType,
      Test04Expected
    > = Expected.assignShouldFailed;
    expect(test04Result).toBeDefined();
  });

  describe('L_Ids <L>', () => {
    test("when L is ''", () => {
      type TestExpected = never;

      type TestRealType = L_Ids<''>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is ' abc '", () => {
      type TestExpected = never;

      type TestRealType = L_Ids<' abc '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is ' {abc} '", () => {
      type TestExpected = 'abc';

      type TestRealType = L_Ids<' {abc} '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is ' {abc} {=123} '", () => {
      type TestExpected = 'abc';

      type TestRealType = L_Ids<' {abc} {=123} '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is ' {abc} {=123} {opq} '", () => {
      type TestExpected = 'abc' | 'opq';

      type TestRealType = L_Ids<' {abc} {=123} {opq} '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });
  });

  describe('L_Regex <L>', () => {
    test("when L is ''", () => {
      type TestExpected = '';

      type TestRealType = L_Regex<''>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is ' abc 123 '", () => {
      type TestExpected = ' abc 123 ';

      type TestRealType = L_Regex<' abc 123 '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is ' {abc} {=123} '", () => {
      type TestExpected = ' {*} {=*} ';

      type TestRealType = L_Regex<' {abc} {=123} '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBe(Expected.assignShouldPassed);
    });

    test("when L is ' {   abc } {=hello world! } { obj } '", () => {
      type TestExpected = ' {*} {=*} {*} ';

      type TestRealType = L_Regex<' {   abc } {=hello world! } { obj } '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is ' { { abc } } '", () => {
      type TestExpected = ' {*} } '; /// actualy expected behaviour TODO: - handle nested {}

      type TestRealType = L_Regex<' { { abc } } '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is ' { abc {  '", () => {
      type TestExpected = ' { abc {  ';

      type TestRealType = L_Regex<' { abc {  '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });
  });

  describe('L_IdNamesTuple <L>', () => {
    test("when L is ''", () => {
      type TestExpected = [];

      type TestRealType = L_IdNamesTuple<''>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is ' abc '", () => {
      type TestExpected = [];

      type TestRealType = L_IdNamesTuple<' abc '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is ' {abc} '", () => {
      type TestExpected = ['abc'];

      type TestRealType = L_IdNamesTuple<' {abc} '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is ' {abc} {=123} '", () => {
      type TestExpected = ['abc'];

      type TestRealType = L_IdNamesTuple<' {abc} {=123} '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is ' {abc} {=123} {opq} '", () => {
      type TestExpected = ['abc', 'opq'];

      type TestRealType = L_IdNamesTuple<' {abc} {=123} {opq} '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });
  });

  describe('SplittedThat', () => {
    test("when that is ''", () => {
      type TestExpected = readonly [];

      type TestRealType = SplittedThat<''>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test('when that is single line with no \\n', () => {
      type TestExpected = readonly ['this is a test'];

      type TestRealType = SplittedThat<'  this is a test  '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test('when that is single line with some \\n s', () => {
      type TestExpected = readonly ['this is a', 'multi-line', 'test'];

      type TestRealType = SplittedThat<
        ' \n this is a \n multi-line \n test  '
      >;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });
  });

  describe('IdsTypeMap - given (L: union of string) -> map of { Id: TypeAlias } generated from lines starting with "IdTypes: "', () => {
    test("when L is ''", () => {
      type TestExpected = {};

      type TestRealType = IdsTypeMap<''>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is ' {c2} ref {c1} '", () => {
      type TestExpected = {};

      type TestRealType = IdsTypeMap<' {c2} ref {c1} '>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is 'IdTypes: c1: Date'", () => {
      type TestExpected = {
        c1: 'Date';
      };
      type TestRealType = IdsTypeMap<'IdTypes: c1: Date'>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is 'IdTypes: now, count: number; d1: Date; o1: Object'", () => {
      type TestExpected = {
        now: 'number';
        count: 'number';
        d1: 'Date';
        o1: 'Object';
      };
      type TestRealType = IdsTypeMap<
        'IdTypes: now, count: number; d1: Date; o1: Object'
      >;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test('when given a union of Ls', () => {
      type TestExpected = {
        now: 'number';
        count: 'number';
        d1: 'Date';
        o1: 'Object';
        c1: 'Company';
      };
      type TestRealType = IdsTypeMap<
        | 'IdTypes: c1: Company'
        | 'IdTypes: now, count: number; d1: Date; o1: Object'
      >;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });
  });

  describe('AnyTypesMap - given (L: union of string) -> map of { (Id | TypeAlias)?: any } generated with any undefined Id/TypeAlias', () => {
    test("when L is ''", () => {
      type TestExpected = {};

      type TestRealType = AnyTypesMap<''>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is '{c2} ref {c1}'", () => {
      type TestExpected = { c2: any; c1: any };
      type TestRealType = Required<AnyTypesMap<' {c2} ref {c1} '>>;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is 'IdTypes: c1: Company' | '{c2} ref {c1}'", () => {
      type TestExpected = { Company: any; c2: any };
      type TestRealType = Required<
        AnyTypesMap<'IdTypes: c1: Company' | '{c2} ref {c1}'>
      >;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test("when L is 'IdTypes: c1: Company' | '{c2} ref {c1}' can not assign unknown props", () => {
      type TestExpected = { z: Date };
      type TestRealType = AnyTypesMap<
        'IdTypes: c1: Company' | '{c2} ref {c1}'
      >;

      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldFailed;
      expect(testResult).toBeDefined();
    });
  });

  describe('StepsMetaMap', () => {
    const that = `
      IdTypes: o1: Obj1
      Given an object { o1 } has a prop {=a} {=123} exist
        And object { o2 } is {=a} deep copy of { o1 }
    ` as const;
    type TypesMap = { Obj1: MyObj1; o2: MyObj2 };
    interface MyObj1 {
      a: number;
      d: Date;
    }
    interface MyObj2 {
      a: number;
      b: boolean;
    }

    type Lines = SplittedThat<typeof that>[number];
    type _IdsTypeMap = IdsTypeMap<Lines>;
    type MetaMap = StepsMetaMap<Lines, _IdsTypeMap, TypesMap>;

    test('Has expected TypesMap constrain', () => {
      type TestExpected = { Obj1: any; o2: any };
      type TestRealType = Required<AnyTypesMap<Lines>>;
      const testResult: AssertTypeMatchesExpected<
        TestRealType,
        TestExpected
      > = Expected.assignShouldPassed;
      expect(testResult).toBeDefined();
    });

    test('step 1 ..meta OK', () => {
      type Meta = MetaMap['an object { o1 } has a prop {=a} {=123} exist'];
      // ----------------------------
      type StepInfoRefExpected = 'an object { o1 } has a prop {=a} {=123} exist';
      type StepInfoRefReal = Meta['stepInfoRef'];
      const stepInfoRefResult: AssertTypeMatchesExpected<
        StepInfoRefReal,
        StepInfoRefExpected
      > = Expected.assignShouldPassed;
      expect(stepInfoRefResult).toBeDefined();
      // ----------------------------
      type StepRegexpExpected = 'an object {*} has a prop {=*} {=*} exist';
      type StepRegexpReal = Meta['stepRegexp'];
      const stepRegexpResult: AssertTypeMatchesExpected<
        StepRegexpReal,
        StepRegexpExpected
      > = Expected.assignShouldPassed;
      expect(stepRegexpResult).toBeDefined();
      // ----------------------------
      type StepIdNamesExpected = ['o1'];
      type StepIdNamesReal = Meta['stepIdNamesTuple'];
      const stepIdNamesResult: AssertTypeMatchesExpected<
        StepIdNamesReal,
        StepIdNamesExpected
      > = Expected.assignShouldPassed;
      expect(stepIdNamesResult).toBeDefined();
      // ----------------------------
      type StepIdsTupleExpected = [MyObj1];
      type StepIdsTupleReal = Meta['stepIdsTuple'];
      const stepIdsTupleResult: AssertTypeMatchesExpected<
        StepIdsTupleReal,
        StepIdsTupleExpected
      > = Expected.assignShouldPassed;
      expect(stepIdsTupleResult).toBeDefined();
      // ----------------------------
      type StepValuesTupleExpected = ['a', '123'];
      type StepValuesTupleReal = Meta['stepValuesTuple'];
      const stepValuesTupleResult: AssertTypeMatchesExpected<
        StepValuesTupleReal,
        StepValuesTupleExpected
      > = Expected.assignShouldPassed;
      expect(stepValuesTupleResult).toBeDefined();
    });

    test('step 2 ..meta OK', () => {
      type Meta = MetaMap['object { o2 } is {=a} deep copy of { o1 }'];
      // ----------------------------
      type StepInfoRefExpected = 'object { o2 } is {=a} deep copy of { o1 }';
      type StepInfoRefReal = Meta['stepInfoRef'];
      const stepInfoRefResult: AssertTypeMatchesExpected<
        StepInfoRefReal,
        StepInfoRefExpected
      > = Expected.assignShouldPassed;
      expect(stepInfoRefResult).toBeDefined();
      // ----------------------------
      type StepRegexpExpected = 'object {*} is {=*} deep copy of {*}';
      type StepRegexpReal = Meta['stepRegexp'];
      const stepRegexpResult: AssertTypeMatchesExpected<
        StepRegexpReal,
        StepRegexpExpected
      > = Expected.assignShouldPassed;
      expect(stepRegexpResult).toBeDefined();
      // ----------------------------
      type StepIdNamesExpected = ['o2', 'o1'];
      type StepIdNamesReal = Meta['stepIdNamesTuple'];
      const stepIdNamesResult: AssertTypeMatchesExpected<
        StepIdNamesReal,
        StepIdNamesExpected
      > = Expected.assignShouldPassed;
      expect(stepIdNamesResult).toBeDefined();
      // ----------------------------
      type StepIdsTupleExpected = [MyObj2, MyObj1];
      type StepIdsTupleReal = Meta['stepIdsTuple'];
      const stepIdsTupleResult: AssertTypeMatchesExpected<
        StepIdsTupleReal,
        StepIdsTupleExpected
      > = Expected.assignShouldPassed;
      expect(stepIdsTupleResult).toBeDefined();
      // ----------------------------
      type StepValuesTupleExpected = ['a'];
      type StepValuesTupleReal = Meta['stepValuesTuple'];
      const stepValuesTupleResult: AssertTypeMatchesExpected<
        StepValuesTupleReal,
        StepValuesTupleExpected
      > = Expected.assignShouldPassed;
      expect(stepValuesTupleResult).toBeDefined();
    });
  });
});
