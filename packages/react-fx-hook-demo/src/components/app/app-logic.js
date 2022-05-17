/* eslint-disable no-console */
import { logicPhases } from '@claritale/react-fx-hook'

const {
  applyIoPhasesShapes,
  fork,
  once,
} = logicPhases

/**
 * @typedef {Object} StateShape
 * @property {number} runningSeconds
 * @property {number} secsBeforeReset
 */

/**
 * @type {StateShape}
 */
export const AppInitialState = {
  runningSeconds:  0,
  secsBeforeReset: 0,
}

export const AppActions = {
  /**
   * @param {number} secs
   */
  updateRunningSecs: (secs) => ({ secs }),
  resetRunningSecs:  (countDown) => ({ countDown }),
  downTick:          (tick) => ({ tick }),
}

const {
  actions, actionsEmitter, untilAction, setState, fromState, ActionsQueue,
} = applyIoPhasesShapes({
  stateShape:   AppInitialState,
  actionsShape: AppActions,
})

export function* AppLogic() {
  yield* fork(appRunningSecsLogic)

  console.log('app logic running!')
}

function* appRunningSecsLogic() {
  let secs = 0
  const reset = () => { secs = 0 }

  const runningActions = yield* ActionsQueue(['updateRunningSecs', 'resetRunningSecs'])

  yield* actionsEmitter(
    (emit) => {
      const interval = setInterval(
        () => { emit.updateRunningSecs(++secs) },
        1000,
      )
      return () => {
        clearImmediate(interval)
      }
    },
  )

  while (true) {
    const action = yield* runningActions.dequeue()

    switch (action.actionKey) {
      case 'updateRunningSecs': {
        yield* setState({ runningSeconds: action.secs })
        break
      }

      case 'resetRunningSecs': {
        yield* resetCountDown(action.countDown, reset)
        break
      }

      default:
        break
    }
  }
}

function* resetCountDown(countDown, resetFn) {
  const secsBeforeReset = yield* fromState.getByKey('secsBeforeReset')
  if (secsBeforeReset > 0) return

  const downTicks = yield* ActionsQueue('downTick')

  for (let i = countDown; i >= 0; i -= 1) {
    yield* actions.downTick(i)
  }

  yield* fork(function* countingDownGen() {
    while (true) {
      const currTick = yield* downTicks.dequeue()

      yield* setState({ secsBeforeReset: currTick.tick })

      if (currTick.tick === 0) break
      yield* customPause(1000)
    }
    
    resetFn()
  })
}

function* customPause(forMs) {
  yield* once(new Promise((done) => {
    setTimeout(done, forMs)
  }))
}
