type IsAny<T> = T extends never ? true : never;
type IsNever<T> = [T] extends [never] ? true : never;
type IsEmptyArray<T> = T extends [] ? true : never;
type IsObject<T> = [T] extends [object] ? true : never;

const TestPassed = 'Test Passed!!';
const TestFailed = 'Test Failed.';

// type ReportFailed<RealType, ExpectedType>
//   = typeof TestFailed | ['Expected: ', ExpectedType, 'but got', RealType]

export type AssertTypeMatchesExpected<
  RealType,
  ExpectedType
> = true extends Match<RealType, ExpectedType>
  ? typeof TestPassed
  : typeof TestFailed | ['Expected: ', ExpectedType, 'but got', RealType];

type Match<RealType, ExpectedType> =
  // any ?
  true extends IsAny<RealType>
    ? true extends IsAny<ExpectedType>
      ? true
      : never
    : // never ?
    true extends IsNever<RealType>
    ? true extends IsNever<ExpectedType>
      ? true
      : never
    : // tuples ?
    RealType extends [infer R1, ...(infer TR)]
    ? ExpectedType extends [infer E1, ...(infer TE)]
      ? // head to head
        true extends Match<R1, E1>
        ? // tail to tail
          true extends IsEmptyArray<TR>
          ? true extends IsEmptyArray<TE>
            ? true
            : never
          : Match<TR, TE>
        : never
      : never
    : // objects ?
    true extends IsObject<RealType>
    ? true extends IsObject<ExpectedType>
      ? RealType extends ExpectedType
        ? true
        : never
      : never
    : // primitive ..
    [RealType] extends [ExpectedType]
    ? true
    : never;

export const Expected = {
  assignShouldPassed: TestPassed,
  assignShouldFailed: TestFailed,
} as const;
