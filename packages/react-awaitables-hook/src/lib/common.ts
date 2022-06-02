/* eslint-disable @typescript-eslint/no-explicit-any */

import { Awaitable, Defer, StringKeyedMap } from './core';

export function createDefer(): Defer {
  const d: any = {};
  d.promise = new Promise((res, rej) => {
    d.resolve = res;
    d.reject = rej;
  });
  return d;
}

export function isValidStringProp(p: string | symbol): p is string {
  return !(typeof p !== 'string' || ['$$typeof', '@@__IMMUTABLE_ITERABLE__@@', '@@__IMMUTABLE_RECORD__@@', 'asymmetricMatch'].includes(p));
}

export type SafeExecutionWrapper = <P extends any[], R>(toExec: Awaitable<P, R>) => Awaitable<P, R>

export const bindAwaitables = <
  AwaitablesMap extends StringKeyedMap<Awaitable<any, any> | StringKeyedMap<Awaitable<any, any>>>
>(
  safeExecutionWrapper: SafeExecutionWrapper, 
  awaitablesMap: AwaitablesMap
): AwaitablesMap => {
  return Object.entries(awaitablesMap)
    .reduce((m, [aKey, aV]) => {
      return Object.assign(m, {
        [aKey]: typeof aV === 'function' 
          ? safeExecutionWrapper(aV) 
          : new Proxy(aV, {
            get: (t, p, r) => {
              if (!isValidStringProp(p)) return Reflect.get(t, p, r)
              return safeExecutionWrapper(t[p])
            }
          }) 
      })
    }, {}) as any
}

