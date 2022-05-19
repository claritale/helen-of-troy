/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

const TestPassed = 'Test Passed!!';
const TestFailed = 'Test Failed.';

export type AssertTypeMatchesExpected<
  RealType,
  ExpectedType
> = true extends Match<RealType, ExpectedType>
  ? typeof TestPassed
  : typeof TestFailed | [Expected: ExpectedType, Received: RealType];

export const Expected = {
    assignmentShouldPass: TestPassed,
    assignmentShouldFail: TestFailed,
  } as const;


  type Match<RealType, ExpectedType> =
    // expecting anys ?
    true extends IsAny<ExpectedType>
    ? true extends IsAny<RealType>
      ? true
      : never
    : // expecting unknown ?
    true extends IsUnknown<ExpectedType>
    ? true extends IsUnknown<RealType>
      ? true
      : never
    : // real unknown ?
    true extends IsUnknown<RealType>
    ? true extends IsUnknown<ExpectedType>
      ? true
      : never
    : // expecting nevers ?
    true extends IsNever<ExpectedType>
    ? true extends IsNever<RealType>
      ? true
      : never
    : // expecting str literals ?
    true extends IsStrLiteral<ExpectedType>
    ? true extends IsStrLiteral<RealType>
      ? IsContaining<RealType, ExpectedType>
      : never      
    : // expecting builtins ?
    true extends IsBuiltin<ExpectedType>
    ? true extends IsBuiltin<RealType>
      ? IsContaining<RealType, ExpectedType>
      : never      
    : // expecting funcs ?
    [ExpectedType] extends [(...args: any[]) => any]
    ? [RealType] extends [(...args: any[]) => any]
      ? // same params ?
        true extends Match<Parameters<RealType>, Parameters<ExpectedType>>
        ? // same returns ?
          Match<ReturnType<RealType>, ReturnType<ExpectedType>>
        : never
      : never    
    : // expecting arrays / tuples ?
    [ExpectedType] extends [(infer UE)[]]
    ? [RealType] extends [(infer UR)[]]
      ? // are empty ?
        true extends IsEmptyArray<ExpectedType>
        ? true extends IsEmptyArray<RealType>
          ? // match elems type ?
            Match<UR, UE>
          : never
        : // elem to elem
          ExpectedType extends [infer EE, ...infer TE]
          ? RealType extends [infer RE, ...infer TR]      
            ? // head to head
              true extends Match<RE, EE>
              ? // tail to tail
                Match<TR, TE>
              : never
            : never      
          : never 
      : never 
    : // expecting object ?
    true extends IsObject<ExpectedType>
    ? true extends IsObject<RealType>     
      ? IsContaining<ExpectedType, RealType>
      : never
    : // same ?
    IsContaining<RealType, ExpectedType>;


type IsAny<T> = T extends never ? true : never;
type IsNever<T> = [T] extends [never] ? true : never;
type IsUnknown<T> = [unknown] extends [T] ? true : never;
type IsStrLiteral<T> = [T] extends [string] ? (string extends T ? never : true) : never
type IsBuiltin<T> = 'NonBuiltin' extends (T extends Builtin ? true : 'NonBuiltin') ? never : true;
type IsObject<T> = T extends object ? true : never;
type IsEmptyArray<T> = T extends any[] ? (T extends [infer E, ...infer R] ? never : true) : never;
// type IsFunc<T> = T extends (...args: any[]) => any ? true : never;
type IsContaining<Real, Expected> 
= ((p: Real) => void) extends ((p: Expected) => void)
  ? true
  : never

type Builtin =
  | Date
  | string
  | number
  | boolean
  | undefined;

/**
 * just for debugging
 */
// type K00 = IsAny<any>
// type K01 = IsAny<never>
// type K02 = IsAny<unknown>
// type K03 = IsAny<boolean>
// type K030 = IsAny<'a'>
// type K031 = IsAny<'a' | 'b'>
// type K032 = IsAny<'a' | 'b' | []>
// type K033 = IsAny<'a' | 'b' | boolean>
// type K04 = IsAny<string>
// type K040 = IsAny<boolean | string>
// type K041 = IsAny<boolean | string | []>
// type K05 = IsAny<[]>
// type K050 = IsAny<[number]>
// type K06 = IsAny<{}>
// type K060 = IsAny<{a:number}>
// type K07 = IsAny<() => void>
// type K08 = IsAny<(p: string, x: number) => boolean>
// type K09 = IsAny<(() => void) | ((p: string, x: number) => boolean)>
