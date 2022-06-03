/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { 
  Defer, 
  AnyActionsMap, 
  StringKeyedMap,
} from './core'
import { createDefer, SafeExecutionWrapper, bindAwaitables } from "./common"
import { ActionsHelper } from "./ActionsHelper"
import { BasicAwaitables } from "./BasicAwaitables"

export interface FlowScript<StateShape, ActionsMap extends AnyActionsMap = any> {
  (_: BasicAwaitables<StateShape, ActionsMap>): Promise<void> | void
}

type CanceledStatus = false | { reason: 'manual' | 'unmounted' | 'error', error?: unknown }
export type FinishCb = (canceled: CanceledStatus) => void
export type HookOptions = { finishCb?: FinishCb, logger?: Console }

export function useAwaitables<
  StateShape extends StringKeyedMap<any>, 
  ActionsMap extends AnyActionsMap
>(
  initialState: StateShape, 
  actionsMap: ActionsMap,
  options: HookOptions = {}
) {
  const logger = options.logger ?? console
  const nextRenderPromiseRef = useRef<Defer | null>(null)
  const registerForNextRender = useCallback((): Promise<void> => {
    if (!nextRenderPromiseRef.current) {
      nextRenderPromiseRef.current = createDefer()
    }
    return nextRenderPromiseRef.current.promise
  }, [])

  const [state, internalSetState] = useState<StateShape>(initialState)
  
  const mem = useMemo<{
    mounted: boolean
    prevState: StateShape
    flowScript?: FlowScript<StateShape, ActionsMap>
    actionsHelper: ActionsHelper<ActionsMap>
  }>(() => ({ 
    mounted: false, 
    prevState: initialState, 
    actionsHelper: new ActionsHelper(actionsMap, registerForNextRender) 
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

  const execWhileIsMounted = useCallback<SafeExecutionWrapper>((toExec) => {
    const assertIsMounted = (v?: any) => {
      if (mem.mounted) return v
      throw new Error(CANCELED)
    }
    return (...params) => {
      assertIsMounted()
      return toExec(...params)
        .then(assertIsMounted)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const awaitablesMap = useMemo(() => bindAwaitables(
    execWhileIsMounted, 
    new BasicAwaitables<StateShape, ActionsMap>(
      internalSetState, 
      registerForNextRender,
      mem.actionsHelper.untilCalled,
      mem.actionsHelper.toCall,
    )
  ), []) // eslint-disable-line react-hooks/exhaustive-deps

  const flowRunner = (flowScript: FlowScript<StateShape, ActionsMap>) => {
    mem.flowScript = flowScript
  }

  useEffect(() => {
    mem.mounted = true
    const unmountedDefer = createDefer()

    const finishState: { canceled: CanceledStatus } = { canceled: false }
    unmountedDefer.promise
      .then(() => {
        if (finishState.canceled === false) {
          finishState.canceled = { reason: 'unmounted' }
        }
      })

    const runFlowScript = async () => {
      try {
        await Promise.resolve(
          // mem.flowScript?.({ setState, delay, untilAction })
          mem.flowScript?.(awaitablesMap)
        )
      } catch (e) {
        if (finishState.canceled && finishState.canceled.reason === 'unmounted') {
          return
        }
        if (e instanceof Error && e.message === CANCELED) {
          finishState.canceled = { reason: 'manual' }
          return
        }
        finishState.canceled = { reason: 'error', error: e }
        logger.error('Catched Error running the Flow ->', e)
      }
    }

    Promise.race([
      unmountedDefer.promise,
      runFlowScript()
    ])
      .catch((e) => {
        console.error('Unexpected unhandled error ->', e)
      })
      .finally(() => {
        options.finishCb?.(finishState.canceled)
      })

    return () => {
      mem.mounted = false
      unmountedDefer.resolve()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mem.prevState = state
    nextRenderPromiseRef.current?.resolve()
    nextRenderPromiseRef.current = null
  })

  return { 
    flowRunner,
    state,
    actions: mem.actionsHelper.toCall
  }
}

const CANCELED = 'CANCELED'