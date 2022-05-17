/* eslint-disable import/prefer-default-export */
import {
  useState, useEffect, useRef, useMemo,
} from 'react'
import { HookCore } from './core'
import { noOp } from './phases'

let nextTick = 1
const getNextTick = () => {
  // eslint-disable-next-line no-plusplus
  const tick = nextTick++
  return tick
}

const times = {}
const withTime = (msg) => {
  times[msg] = (times[msg] || 0) + 1
  const time = times[msg]
  return `time ${time} - ${msg}`
}

/**
 * @template S, A
 * @typedef {import('./Types').LogicSetup<S,A>} LogicSetup
 */

/**
 * @description React custom hook to run the component logic/effects
 * @template StateShape, ActionsShape
 * @param {LogicSetup<StateShape, ActionsShape>} setup
 * @param {Object.<string,any>} currentProps
 *
 * @returns {[StateShape, ActionsShape]}
 */
export function useLogic(setup, currentProps) {
  const [renderTick, setRenderTick] = useState(0)
  const reRender = () => setRenderTick(getNextTick())

  const log = (msg) => {
    // eslint-disable-next-line no-console
    if (setup.enableLogs) console.log(msg)
  }

  const coreRef = useRef()

  useMemo(() => {
    log('$$$ hook init')
    const core = new HookCore(setup.initialState, setup.actionsMap, reRender, setup.enableLogs)

    coreRef.current = core
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const core = coreRef.current
    const { usings } = core

    log('Did mount') // eslint-disable-line no-console
    usings.hook.mounted = true

    log(withTime('useLogic - startLogic')) // eslint-disable-line no-console
    core.startLogic(setup.mainLogicGen, setup.onFinish || noOp)

    return () => {
      log('Did unmount') // eslint-disable-line no-console
      usings.hook.mounted = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  coreRef.current.usingProps(currentProps)

  const appState = useMemo(
    () => coreRef.current.usings.statesSnapshot(),
    [renderTick], // eslint-disable-line react-hooks/exhaustive-deps
  )

  return [appState, coreRef.current.actions, coreRef.current.usings.terminate]
}
