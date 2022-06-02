/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Defer {
  promise: Promise<any>,
  resolve: (v?: any) => void
  reject: (e: unknown) => void
}

export type Awaitable<Params extends any[], Result> = (...args: Params) => Promise<Result>

export type InternalSetState<StateShape> = (update: StateUpdate<StateShape>) => void
export type StateUpdate<StateShape> = StateShape | ((prev: StateShape) => StateShape)

export type TestingActionsToCall<ActionsMap extends AnyActionsMap> = ActionsToCall<ActionsDescriptorMap<ActionsMap>>

export type ActionsToCall<ActionsDescMap> = ActionsDescMap extends AnyActionsDescMap 
? { [ActionId in keyof ActionsDescMap]: ActionsDescMap[ActionId]['calling'] }
: never

export type UntilActionFn<ActionsDescMap extends AnyActionsDescMap>
= <ActionId extends keyof ActionsDescMap>(waitingFor: 'ANY' | ActionId | ActionId[]) => Promise<UntilActionReturn<ActionsDescMap, ActionId>>

type UntilActionReturn<ActionsDescMap, ActionId extends keyof ActionsDescMap> = ActionsDescMap extends AnyActionsDescMap
? ActionsDescMap[ActionId]['returning']
: never


export type AnyActionsDescMap = ActionsDescriptorMap<AnyActionsMap>
export type AnyActionsMap = StringKeyedMap<(...args: any) => StringKeyedMap<any>>
export type StringKeyedMap<V> = { [key: string]: V }

export type ActionsDescriptorMap<ActionsMap extends AnyActionsMap> = 
{
  [Id in keyof ActionsMap]: {
    calling: (...params: Parameters<ActionsMap[Id]>) => Promise<void>,
    returning: { actionId: Id } & ReturnType<ActionsMap[Id]>
  }
}

// type ValuesOf<T> = T[keyof T]


// // Typings Demos
// const aMap = { 
//   canStart: (can: boolean) => ({ canNot: !can }),
//   setName: (name: string) => ({ guessName: name }),
//   // invalid: (name: string) => false,
// }
// type T0 = ActionsDescriptorMap<typeof aMap>
// type T00 = keyof T0
// type T1 = ActionsToCall<T0>
// type T2 = UntilActionReturn<T0, 'canStart'>
// type T3 = UntilActionReturn<T0, 'setName'>
// // type T4 = UntilActionReturn<T0, 'invalid'> 
// type T5 =  UntilActionFn<T0>
// // const ua: T5 = (() => ({})) as any
// // ua()
