/* eslint-disable @typescript-eslint/no-explicit-any */
// import styles from './react-awaitables-hook.module.css';

import { useCallback, useEffect, useRef, useState } from "react"

/* eslint-disable-next-line */
export interface ReactAwaitablesHookProps {}

interface Defer {
  promise: Promise<any>,
  resolve: (v?: any) => void
  reject: (e: unknown) => void
}

type StateUpdate<StateShape> = StateShape | ((prev: StateShape) => StateShape)

interface FlowAwaitables<StateShape, ActionsDescMap extends ActionsDescriptorMap<AnyActionsMap>> {
  setState: (update: StateUpdate<StateShape>) => Promise<void>
  delay: (miliseconds: number) => Promise<void>
  untilAction: UntilActionFn<ActionsDescMap>
}

export declare interface FlowScript<StateShape, ActionsMap extends AnyActionsMap = any> {
  (_: FlowAwaitables<StateShape, ActionsDescriptorMap<ActionsMap>>): Promise<void> | void
}

class ActionsHelper<
  ActionsMap extends AnyActionsMap, 
  _ActionsDescMap extends ActionsDescriptorMap<AnyActionsMap> = ActionsDescriptorMap<ActionsMap>,
> {
  private pendingActionsMap: StringKeyedMap<Array<Defer>>
  constructor(
    private actionsMap: ActionsMap
  ) {
    this.pendingActionsMap = {}
  }

  private getPending = (actionId: string, andFlush = false) => {
    if (!this.pendingActionsMap[actionId]) this.pendingActionsMap[actionId] = []
    const pending = this.pendingActionsMap[actionId]
    if (andFlush) this.pendingActionsMap[actionId] = []
    return pending
  }

  untilCalled: UntilActionFn<_ActionsDescMap> = ((actionId: any) => {
    const d = createDefer()
    this.getPending(String(actionId)).push(d)
    return d.promise
  }) as any

  toCall = new Proxy<ActionsToCall<_ActionsDescMap>>(this.actionsMap as any, {
    get: (t, p) => {
      // if (['$$typeof', '@@__IMMUTABLE_ITERABLE__@@'].includes(p)) {
      if (typeof p !== 'string' || ['$$typeof', '@@__IMMUTABLE_ITERABLE__@@', '@@__IMMUTABLE_RECORD__@@', 'asymmetricMatch'].includes(p)) {
        return null
      }
      if (!t[p]) {
        throw new Error(`Unknown action id: ${p}`)
      }
      const actionFn = t[p] as any
      const pending = this.getPending(p, true)
      return (...params: any) => {
        const actionObj = actionFn(...params)
        actionObj.actionId = p
        pending.forEach(d => d.resolve(actionObj))
      }
    }
  })
}

interface MemRef<StateShape, ActionsMap extends AnyActionsMap> {
  mounted: boolean
  prevState: StateShape
  flowScript?: FlowScript<StateShape, ActionsMap>
  pendingChanges?: Array<Defer>
  actionsHelper: ActionsHelper<ActionsMap>
}

export function createDefer(): Defer {
  const d: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any
  d.promise = new Promise((res, rej) => {
    d.resolve = res
    d.reject = rej
  })
  return d
}

export function useAwaitables<
  StateShape extends StringKeyedMap<any>, 
  ActionsMap extends AnyActionsMap
>(initialState: StateShape, actionsMap: ActionsMap, logger: Console = console) {
  const [state, internalSetState] = useState<StateShape>(initialState)
  const memRef = useRef<MemRef<StateShape, ActionsMap>>({ 
    mounted: false, 
    prevState: initialState, 
    actionsHelper: new ActionsHelper(actionsMap) 
  })

  const assertIsMounted = useCallback<<T>(v: T) => T>((v) => {
    if (!memRef.current.mounted) {
      throw new Error('ABORTED')
    }
    return v
  }, [])
  const whileIsMounted = useCallback(<P extends any[], R>(toDo: (...args: P) => Promise<R>): (...args: P) => Promise<R> => {
    return (...params) => {
      assertIsMounted(null)
      return toDo(...params)
        .then(assertIsMounted)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const registerPending = useCallback((): Promise<void> => {
    const d = createDefer()
    memRef.current.pendingChanges = [...memRef.current.pendingChanges ?? [], d]
    return d.promise
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const delay = useCallback(whileIsMounted((ms: number): Promise<void> => {
    const d = createDefer()
    setTimeout(d.resolve, ms)
    return d.promise
  }), [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setState = useCallback(whileIsMounted((update: StateUpdate<StateShape>): Promise<void> => {
    internalSetState(update)
    return registerPending()
  }), [])

  // eslint-disable-next-line react-hooks/exhaustive-deps 
  const untilAction = useCallback(whileIsMounted(memRef.current.actionsHelper.untilCalled), [])

  const flowRunner = (flowScript: FlowScript<StateShape, ActionsMap>) => {
    memRef.current.flowScript = flowScript
  }

  useEffect(() => {
    const mem = memRef.current
    mem.mounted = true

    const runFlowScript = async () => {
      try {
        await Promise.resolve(
          mem.flowScript?.({ setState, delay, untilAction })
        )
      } catch (e) {
        if (e instanceof Error && e.message === 'ABORTED') return
        logger.error('Error running the flow', e)
      }
    }
    runFlowScript()

    return () => {
      mem.mounted = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    memRef.current.prevState = state
    memRef.current.pendingChanges?.forEach((d) => {
      d.resolve()
    })
    memRef.current.pendingChanges = undefined
  })

  return { 
    flowRunner,
    state,
    actions: memRef.current.actionsHelper.toCall
  }
}

export type TestingActionsToCall<ActionsMap extends AnyActionsMap> = ActionsToCall<ActionsDescriptorMap<ActionsMap>>

type ActionsToCall<ActionsDescMap> = ActionsDescMap extends AnyActionsDescMap 
? { [ActionId in keyof ActionsDescMap]: ActionsDescMap[ActionId]['calling'] }
: never

type UntilActionFn<ActionsDescMap extends AnyActionsDescMap>
= <ActionId extends keyof ActionsDescMap>(actionId: ActionId) => Promise<UntilActionReturn<ActionsDescMap, ActionId>>

type UntilActionReturn<ActionsDescMap, ActionId extends keyof ActionsDescMap> = ActionsDescMap extends AnyActionsDescMap
? ActionsDescMap[ActionId]['returning']
: never


type AnyActionsDescMap = ActionsDescriptorMap<AnyActionsMap>
type AnyActionsMap = StringKeyedMap<(...args: any) => StringKeyedMap<any>>
type StringKeyedMap<V> = { [key: string]: V }

type ActionsDescriptorMap<ActionsMap extends AnyActionsMap> = 
{
  [Id in keyof ActionsMap]: {
    calling: (...params: Parameters<ActionsMap[Id]>) => void,
    returning: { actionId: Id } & ReturnType<ActionsMap[Id]>
  }
}

type ValuesOf<T> = T[keyof T]


// Typings Demos
const aMap = { 
  canStart: (can: boolean) => ({ canNot: !can }),
  setName: (name: string) => ({ guessName: name }),
  // invalid: (name: string) => false,
}
type T0 = ActionsDescriptorMap<typeof aMap>
type T00 = keyof T0
type T1 = ActionsToCall<T0>
type T2 = UntilActionReturn<T0, 'canStart'>
type T3 = UntilActionReturn<T0, 'setName'>
// type T4 = UntilActionReturn<T0, 'invalid'> 
type T5 =  UntilActionFn<T0>

// const ua: T5 = (() => ({})) as any
// ua()

