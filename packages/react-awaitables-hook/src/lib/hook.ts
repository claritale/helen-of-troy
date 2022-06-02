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

export function useAwaitables<
  StateShape extends StringKeyedMap<any>, 
  ActionsMap extends AnyActionsMap
>(
  initialState: StateShape, 
  actionsMap: ActionsMap, 
  logger: Console = console
) {
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
      throw new Error('ABORTED')
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

    const runFlowScript = async () => {
      try {
        await Promise.resolve(
          // mem.flowScript?.({ setState, delay, untilAction })
          mem.flowScript?.(awaitablesMap)
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

