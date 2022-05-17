
export function assertIsDefined<T>(v: T | null, errorMsg?: string): asserts v {
  if (v == null) throw new Error(errorMsg ?? 'Value is not defined');
}
