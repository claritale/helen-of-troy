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

interface FlowAwaitables<StateShape> {
  setState: (update: StateUpdate<StateShape>) => Promise<void>
  delay: (miliseconds: number) => Promise<void>
}

export declare interface FlowScript<S> {
  (_: FlowAwaitables<S>): Promise<void> | void
}

interface MemRef<StateShape> {
  mounted: boolean
  prevState: StateShape
  flowScript?: FlowScript<StateShape>
  pendingChanges?: Array<Defer>
}

function createDefer(): Defer {
  const d: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any
  d.promise = new Promise((res, rej) => {
    d.resolve = res
    d.reject = rej
  })
  return d
}

export function useAwaitables<
  StateShape extends object, 
  ActionsMap extends object
>(initialState: StateShape, actionsMap: ActionsMap) {
  const [state, internalSetState] = useState<StateShape>(initialState)
  const memRef = useRef<MemRef<StateShape>>({ mounted: false, prevState: initialState })

  const assertIsMounted = () => {
    if (!memRef.current.mounted) {
      throw new Error('ABORTED')
    }
  }
  const registerPending = (): Promise<unknown> => {
    const d = createDefer()
    memRef.current.pendingChanges = [...memRef.current.pendingChanges ?? [], d]
    return d.promise
  }

  const delay = useCallback((ms: number) => {
    assertIsMounted()
    const d = createDefer()
    setTimeout(d.resolve, ms)
    return d.promise
      .then(assertIsMounted)
  }, [])

  const setState = useCallback((update: StateUpdate<StateShape>) => {
    assertIsMounted()
    internalSetState(update)
    return registerPending()
      .then(assertIsMounted)
  }, [])

  const flowRunner = (flowScript: FlowScript<StateShape>) => {
    memRef.current.flowScript = flowScript
  }

  useEffect(() => {
    const mem = memRef.current
    mem.mounted = true

    Promise.resolve(
      mem.flowScript?.({ setState, delay })
    )
    .catch((e) => {
      if (e instanceof Error && e.message === 'ABORTED') return
      console.error('Error running the flow', e)
    })    

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
  }
}

