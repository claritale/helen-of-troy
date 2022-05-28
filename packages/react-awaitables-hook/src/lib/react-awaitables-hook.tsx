// import styles from './react-awaitables-hook.module.css';

import { useCallback, useEffect, useRef, useState } from "react"

/* eslint-disable-next-line */
export interface ReactAwaitablesHookProps {}

interface Defer {
  promise: Promise<any>,
  resolve: (v?: any) => void
  reject: (e: unknown) => void
}

interface MemRef<StateShape> {
  mounted: boolean
  state: StateShape
  flowCb?: () => Promise<any>
  pendingChanges?: Array<Defer>
}

function createDefer(): Defer {
  const d: any = {}
  d.promise = new Promise((res, rej) => {
    d.resolve = res
    d.reject = rej
  })
  return d
}

export function useAwaitables<StateShape extends object>(initialState: StateShape) {
  const [,set] = useState(false)
  const rerender = useCallback(() => set((p) => !p), [])
  const memRef = useRef<MemRef<StateShape>>({ mounted: false, state: initialState })
  const registerPending = (): Promise<any> => {
    const d = createDefer()
    memRef.current.pendingChanges = [...memRef.current.pendingChanges ?? [], d]
    return d.promise
  }

  useEffect(() => {
    memRef.current.pendingChanges?.forEach((d) => {
      d.resolve()
    })
    memRef.current.pendingChanges = undefined
  })

  const setState = useCallback((updateMap: any) => {
    if (!memRef.current.mounted) {
      throw new Error('ABORTED')
    }
    console.log('updating', updateMap)
    Object.assign(memRef.current.state, updateMap)
    const onDone = registerPending()
    rerender()    
    return onDone.then(() => {
      if (!memRef.current.mounted) {
        throw new Error('ABORTED')
      }
    })
  }, [])

  const flowRunner = (flowCb: () => Promise<any>) => {
    memRef.current.flowCb = flowCb
  }

  useEffect(() => {
    const curr = memRef.current
    curr.mounted = true
    if (memRef.current.flowCb) {
      try {
        memRef.current.flowCb()
      } catch (e) {
        const err = e as Error
        if (err.message !== 'ABORTED') {
          throw e
        }
      }
    }
    return () => {
      curr.mounted = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { 
    flowRunner, 
    state: memRef.current.state,
    setState 
  }
}

