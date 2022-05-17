// /* eslint-disable import/prefer-default-export */
// /* eslint-disable max-classes-per-file */
// /* eslint-disable no-underscore-dangle */

import { phaseTypes, noOp } from './phases'

const ANY_ACTION_KEY = '$_ANY_ACTION_KEY_$'
const Pending = new Promise(noOp)

const Defer = () => {
  const d = {}
  d.promise = new Promise((resolve, reject) => {
    d.resolve = resolve
    d.reject = reject
  })
  d.promise.catch(noOp)
  return d
}

class ActionsPubSub {
  subscriptions = {}

  nextQueueRegId = 1

  onCalled = (actionKeyList, enqueue) => {
    const queueRegId = this.nextQueueRegId
    this.nextQueueRegId += 1
    const callDefer = {
      resolve: (a) => enqueue(null, a),
      reject:  (e) => enqueue(e),
    }
    actionKeyList.forEach((actionKey) => {
      if (!this.subscriptions[`${actionKey}_to_enqueue`]) {
        this.subscriptions[`${actionKey}_to_enqueue`] = new Map()
      }
      this.subscriptions[`${actionKey}_to_enqueue`].set(queueRegId, callDefer)
    })
    return () => {
      actionKeyList.forEach((actionKey) => {
        this.subscriptions[`${actionKey}_to_enqueue`].delete(queueRegId)
      })
    }
  }

  onceCalled = (actionKey) => {
    const callDefer = Defer()
    if (!this.subscriptions[actionKey]) {
      this.subscriptions[actionKey] = []
    }
    this.subscriptions[actionKey].push(callDefer)
    return callDefer.promise
  }

  publishCall = (actionKey, { payload, error }) => {
    const forwardCallDefer = (callDefer) => {
      if (error) {
        error.actionKey = actionKey
        callDefer.reject(error)
      } else {
        callDefer.resolve({ ...payload, actionKey })
      }
    }

    if (this.subscriptions[actionKey]) {
      this.subscriptions[actionKey].forEach(forwardCallDefer)
      delete this.subscriptions[actionKey]
    }
    if (this.subscriptions[ANY_ACTION_KEY]) {
      this.subscriptions[ANY_ACTION_KEY].forEach(forwardCallDefer)
      delete this.subscriptions[ANY_ACTION_KEY]
    }
    // to enqueue ...
    if (this.subscriptions[`${actionKey}_to_enqueue`]) {
      this.subscriptions[`${actionKey}_to_enqueue`].forEach(forwardCallDefer)
    }
    if (this.subscriptions[`${ANY_ACTION_KEY}_to_enqueue`]) {
      this.subscriptions[`${ANY_ACTION_KEY}_to_enqueue`].forEach(forwardCallDefer)
    }
  }
}

// const hashObject = function (object) {
//
//   const hash = md5(
//     JSON.stringify(object, function (k, v) {
//       if (k[0] === '_') return undefined
//       // remove api stuff
//       else if (typeof v === 'function')
//         // consider functions
//         return v.toString()
//       else return v
//     })
//   )
//
//   return hash
// }

class PropsPubSub {
  subscriptions = []

  onceChanged = (currProps, selector, changedIf) => {
    const d = Defer()
    let reference
    try {
      reference = selector(currProps)
    } catch (e) { /* ignored */ }
    this.subscriptions.push({
      reference,
      selector,
      changed: changedIf,
      resolve: d.resolve,
    })
    return d.promise
  }

  publishChange = (currProps) => {
    this.subscriptions = this.subscriptions.filter((sub) => {
      let current
      try {
        current = sub.selector(currProps)
        if (sub.changed(sub.reference, current) === false) {
          return true
        }
      } catch (e) { /* ignored */ }
      sub.resolve(current)
      return false
    })
  }
}

class HookMountingObserver {
  _mounted = false

  _mountedDefer = Defer()

  _unmountedDefer = Defer()

  get mounted() {
    return this._mounted
  }

  set mounted(mountedNow) {
    if (!this._mounted && mountedNow) {
      this._mountedDefer.resolve()
    }
    if (this._mounted && !mountedNow) {
      this._unmountedDefer.resolve()
    }
    this._mounted = mountedNow
  }

  get onceMounted() {
    return this._mountedDefer.promise
  }

  get onceUnmounted() {
    return this._unmountedDefer.promise
  }
}

/**
 * @typedef {import('./phases').ActionFn} ActionFn
 */

export class HookCore {
  /**
   * @constructor
   * @param {Object.<string,any>} initialState - initialize state used by your logic
   * @param {Object.<string,ActionFn>} actionsMap
   * @param {() => void} reRender
   */
  constructor(initialState, actionsMap, reRender, enableLogs = false) {
    const usings = {}
    this.usings = usings

    usings.reRender = reRender
    usings.enableLogs = enableLogs

    usings.terminate = noOp

    usings.hook = new HookMountingObserver()
    usings.hook.onceUnmounted.then(() => {
      usings.terminate(true)
    })

    usings.lastProps = {}

    usings.propsPubSub = new PropsPubSub()

    usings.states = {}

    usings.registerState = (rootKey, initialValue) => {
      if (usings.states[rootKey] === undefined) {
        usings.states[rootKey] = {
          value:    initialValue,
          setValue: (v) => {
            if (usings.states[rootKey].value === v) return false
            usings.states[rootKey].value = v
            return true
          },
        }
      }
    }

    Object.entries(initialState).forEach(([rootKey, value]) => {
      usings.registerState(rootKey, value)
    })

    usings.statesSnapshot = () => Object.entries(usings.states).reduce(
      (snapshot, [rootKey, state]) => Object.assign(snapshot, { [rootKey]: state.value }),
      {},
    )

    usings.actionsPubSub = new ActionsPubSub()

    const actionsCache = {}
    usings.actionsProxy = new Proxy(
      {},
      {
        get: (_, actionProp) => {
          if (actionsMap[actionProp] === undefined) {
            if (actionProp === '$$typeof' || typeof actionProp === 'symbol') return undefined
            // eslint-disable-next-line no-console
            console.error(`Called action [${actionProp}] not found in ActionsMap.`)
            return noOp
          }
          if (!actionsCache[actionProp]) {
            actionsCache[actionProp] = (...params) => {
              if (!usings.hook.mounted) return
              try {
                const actionFn = actionsMap[actionProp]
                const payload = actionFn(...params)
                usings.actionsPubSub.publishCall(actionProp, { payload })
              } catch (error) {
                usings.actionsPubSub.publishCall(actionProp, { error })
                // throw error // Should caller get the exception? (much usually the UI??)
              }
            }
          }
          return actionsCache[actionProp]
        },
      },
    )
  }

  get actions() {
    return this.usings.actionsProxy
  }

  startLogic(logicGen, onFinish) {
    const { usings } = this

    const cancelDefer = Defer()
    usings.terminate = (unmounted = false) => {
      cancelDefer.resolve(unmounted)
      usings.terminate = noOp
    }

    runLogic(logicGen, {
      usings,
      onceCancelled: cancelDefer.promise,
    }).then(({ cancelled, error }) => {
      onFinish({ cancelled, error })
    })
  }

  usingProps(currentProps) {
    if (this.usings.lastProps !== currentProps) {
      this.usings.propsPubSub.publishChange(currentProps)
    }
    this.usings.lastProps = currentProps
  }
}

const LogicStopCodes = {
  TaskError:        'TaskError',
  SubTaskError:     'SubTaskError',
  StateKeyNotFound: 'StateKeyNotFound',
  PropKeyNotFound:  'PropKeyNotFound',
}
class LogicStop extends Error {
  constructor({ code, msg, innerError }) {
    super(msg)
    this.code = code
    this.innerError = innerError || null
  }

  static StateKeyNotFound(key) {
    return new LogicStop({
      code: LogicStopCodes.StateKeyNotFound,
      msg:  `state not found. key [${key}]`,
    })
  }

  static PropKeyNotFound(key) {
    return new LogicStop({
      code: LogicStopCodes.PropKeyNotFound,
      msg:  `prop not found. key [${key}]`,
    })
  }
}

const copy = (v) => JSON.parse(JSON.stringify(v))

const logger = (gen, active) => (cycle, msg, ctxGetter = (() => [])) => {
  if (!active) return
  // eslint-disable-next-line no-console
  console.log(`%c${gen.name}`, 'color:blue; font-size: 16px', `c${cycle}`, msg, ...ctxGetter())
}

async function runLogic(logicGen, { usings, params = [], onceCancelled = Pending }) {
  const log = logger(logicGen, usings.enableLogs)
  log(0, '@here 0. Started!')

  const logic = logicGen(...params)

  const logicState = {
    lastYielded:       { done: false },
    yieldedAfterBreak: null,
    cancelled:         false,
    error:             false,
  }
  // const logicStoppedDefer = Defer()
  let nextTaskId = 1
  const subTaskMap = new Map()
  let phaseHandleBrokenDefer = Defer()
  const phaseHandleStart = () => {
    phaseHandleBrokenDefer = Defer()
  }
  const breakPhaseHandle = () => {
    phaseHandleBrokenDefer.resolve()
  }
  const oncePhaseHandleBroken = () => phaseHandleBrokenDefer.promise

  const registerFork = (task) => {
    const taskId = nextTaskId++ // eslint-disable-line no-plusplus
    subTaskMap.set(taskId, task)

    task.onceFinished
      .then(({ error: errorInSubTask }) => {
        subTaskMap.delete(taskId)
        if (errorInSubTask && !logicState.error) {
          try {
            logicState.yieldedAfterBreak = logic.throw(errorInSubTask)
            breakPhaseHandle()
          } catch (e) {
            cancel({ withError: e })
          }
        }
      })
    return taskId
  }
  const cancelFork = (taskId) => {
    const task = subTaskMap.get(taskId)
    if (task) task.cancel()
  }
  const cancel = ({ unmounted = false, withError = false }) => {
    if (logicState.cancelled) return
    logicState.cancelled = { unmounted }
    subTaskMap.forEach((task) => task.cancel(unmounted))
    if (!logicState.error) {
      if (!withError) {
        logicState.yieldedAfterBreak = logic.return()
      } else {
        logicState.error = withError
        try {
          logicState.yieldedAfterBreak = logic.throw(
            new LogicStop({ code: LogicStopCodes.SubTaskError, innerError: withError }),
          )
        } catch (e) { /* ignored */ }
      }
    }
    breakPhaseHandle()
    // logicStoppedDefer.resolve()
  }
  onceCancelled.then((unmounted) => cancel({ unmounted }))

  let c = 0

  // phases' stepping loop
  while (!logicState.lastYielded.done) {
    try {
      c += 1
      const phase = logicState.lastYielded.value
      logicState.lastYielded = { done: true }
      let yieldResult

      log(c, '@here 1. to handle', () => [phase || '[NOTHING]', copy(logicState)])
      if (phase) {
        phaseHandleStart()
        // eslint-disable-next-line no-await-in-loop
        yieldResult = await handleYieldedPhase(
          phase,
          usings,
          registerFork,
          cancelFork,
          logicState.cancelled,
          oncePhaseHandleBroken,
          // logicStoppedDefer.promise,
        )
        log(c, '@here 2. result', () => [yieldResult, phase.type, copy(logicState)])
        if (!logicState.yieldedAfterBreak && yieldResult instanceof Error) {
          logicState.yieldedAfterBreak = logic.throw(yieldResult)
        }
      }

      if (!logicState.yieldedAfterBreak) {
        // eslint-disable-next-line no-await-in-loop
        logicState.lastYielded = await Promise.resolve(logic.next(yieldResult))
        log(c, '@here 3. next', () => [logicState.lastYielded.value, copy(logicState)])
      } else {
        // eslint-disable-next-line no-await-in-loop
        logicState.lastYielded = await Promise.resolve(logicState.yieldedAfterBreak)
        log(c, '@here 3. next [after throw]', () => [logicState.lastYielded.value, copy(logicState)])
        logicState.yieldedAfterBreak = null
      }
    } catch (e) {
      log(c, '@here 9. error', () => [e, copy(logicState)])
      if (e.constructor === LogicStop && e.cancelled) {
        break
      } else {
        cancel({ withError: e })
      }
    }
  }

  log(c, '@here w. final wait', () => [subTaskMap.size, copy(logicState)])
  const activeSubTasks = []
  subTaskMap.forEach((task) => {
    activeSubTasks.push(task)
  })
  if (activeSubTasks.length) {
    await Promise.all(activeSubTasks.map((task) => task.onceFinished))
  }

  const final = {
    cancelled: logicState.cancelled,
    error:     logicState.error,
  }
  log(c, '@here z. exit', () => [final])
  return final
}

async function handleYieldedPhase(
  phase, usings, registerFork, cancelFork,
  isCancelled, onceWantedBroken, // onceLogicStopped
) {
  switch (phase.type) {
    case phaseTypes.cancelled: {
      return Promise.resolve(isCancelled)
    }

    case phaseTypes.fork: {
      const ts = {
        finishDefer: Defer(),
        cancelDefer: Defer(),
      }
      const subTask = {
        get onceFinished() {
          return ts.finishDefer.promise
        },
        cancel: (unmounted = false) => {
          ts.cancelDefer.resolve(unmounted)
        },
      }
      const taskId = registerFork(subTask)

      runLogic(phase.subTaskGen, {
        params:        phase.subTaskParams,
        usings,
        onceCancelled: ts.cancelDefer.promise,
      }).then(({ cancelled, error }) => {
        ts.finishDefer.resolve({ cancelled, error })
      })

      return Promise.resolve({ taskId })
    }

    case phaseTypes.cancel: {
      const { taskId } = phase.subTask || {}
      if (taskId) cancelFork(taskId)
      return Promise.resolve(true)
    }

    /** long */
    case phaseTypes.oncePromise: {
      const oncePromise = async () => {
        await usings.hook.onceMounted
        if (!usings.hook.mounted) {
          return Promise.resolve(null)
        }
        return phase.promise
        // .catch((e) => Promise.resolve(e))
      }
      return Promise.race([
        oncePromise(),
        onceWantedBroken(),
        // onceLogicStopped,
      ])
    }

    /** long */
    case phaseTypes.race: {
      return Promise.race(
        Object.entries(phase.racersMap)
          .map(([key, racingPhase]) => handleYieldedPhase(
            racingPhase,
            usings,
            registerFork,
            cancelFork,
            isCancelled,
            onceWantedBroken,
            // onceLogicStopped,
          ).then(
            (result) => ({
              [key]:  result,
              winner: key,
              result,
            }),
          )),
      )
    }

    /** long */
    case phaseTypes.delay: {
      return new Promise((done) => {
        const timeout = setTimeout(() => done(true), phase.time)
        // onceLogicStopped.then(() => {
        onceWantedBroken().then(() => {
          clearTimeout(timeout)
          done(false)
        })
      })
    }

    case phaseTypes.doAction: {
      try {
        usings.actionsProxy[phase.actionKey](...phase.params)
        return Promise.resolve(true)
      } catch (e) {
        return Promise.resolve(e)
      }
    }

    case phaseTypes.onAction: {
      const actionKeyList = Array.isArray(phase.actionKey)
        ? phase.actionKey
        : [phase.actionKey === 'ANY' ? ANY_ACTION_KEY : phase.actionKey]
      const unsubscribe = usings.actionsPubSub.onCalled(actionKeyList, phase.enqueue)
      onceWantedBroken().then(() => unsubscribe())
      return Promise.resolve(unsubscribe)
    }

    /** long */
    case phaseTypes.untilAction: {
      let onceActionCalled
      if (phase.waitingFor === 'ANY') {
        onceActionCalled = usings.actionsPubSub.onceCalled(ANY_ACTION_KEY)
      } else if (Array.isArray(phase.waitingFor) && phase.waitingFor.length > 1) {
        onceActionCalled = Promise.race(
          phase.waitingFor.map(
            (actionKey) => usings.actionsPubSub.onceCalled(actionKey),
          ),
        )
      } else {
        onceActionCalled = usings.actionsPubSub.onceCalled(
          Array.isArray(phase.waitingFor) ? phase.waitingFor[0] : phase.waitingFor,
        )
      }
      return Promise.race([
        onceActionCalled,
        onceWantedBroken(),
        // onceLogicStopped,
      ]).catch((e) => e)
    }

    case phaseTypes.actionsEmitter: {
      const unsubscribe = phase.emitterSubscriber(usings.actionsProxy)
      onceWantedBroken().then(() => unsubscribe())
      return Promise.resolve(true)
    }

    /** long */
    case phaseTypes.getState: {
      const onceState = async () => {
        await usings.hook.onceMounted
        if (!usings.hook.mounted) {
          return Promise.resolve()
        }
        const snapshot = usings.statesSnapshot()
        if (typeof phase.selector === 'function') {
          try {
            return Promise.resolve(phase.selector(snapshot))
          } catch (e) {
            return Promise.resolve(e)
          }
        }
        const key = phase.stateKey
        if (snapshot[key] === undefined) {
          return Promise.resolve(LogicStop.StateKeyNotFound(key))
        }
        return Promise.resolve(snapshot[key])
      }
      return Promise.race([
        onceState(),
        onceWantedBroken(),
        // onceLogicStopped
      ])
    }

    case phaseTypes.setState: {
      let changes = {}
      if (typeof phase.stateOrUpdater === 'function') {
        const snapshot = usings.statesSnapshot()
        try {
          changes = phase.stateOrUpdater(snapshot)
        } catch (e) {
          return Promise.resolve(e)
        }
      } else {
        changes = phase.stateOrUpdater
      }
      if (changes === null) return Promise.resolve(false)
      let reRenderNeeded = false
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, value] of Object.entries(changes)) {
        if (!usings.states[key]) {
          return Promise.resolve(LogicStop.StateKeyNotFound(key))
        }
        if (usings.states[key].setValue(value)) {
          reRenderNeeded = true
        }
      }
      if (reRenderNeeded) usings.reRender()
      return Promise.resolve(reRenderNeeded)
    }

    /** long */
    case phaseTypes.untilPropsChange: {
      const oncePropChanged = usings.propsPubSub.onceChanged(usings.lastProps, phase.selector, phase.changedIf)
      return Promise.race([
        oncePropChanged,
        onceWantedBroken(),
        // onceLogicStopped,
      ])
    }

    /** long */
    case phaseTypes.getProp: {
      const onceProp = async () => {
        await usings.hook.onceMounted
        if (!usings.hook.mounted) {
          return Promise.resolve()
        }
        const snapshot = usings.lastProps
        if (typeof phase.selector === 'function') {
          try {
            return Promise.resolve(phase.selector(snapshot))
          } catch (e) {
            return Promise.resolve(e)
          }
        }
        const key = phase.propKey
        if (snapshot[key] === undefined) {
          return Promise.resolve(LogicStop.PropKeyNotFound(key))
        }
        return Promise.resolve(snapshot[key])
      }
      return Promise.race([
        onceProp(),
        onceWantedBroken(),
        // onceLogicStopped,
      ])
    }

    /** long */
    case phaseTypes.callProp: {
      const onceProp = async () => {
        await usings.hook.onceMounted
        if (!usings.hook.mounted) {
          return Promise.resolve()
        }
        const snapshot = usings.lastProps
        try {
          return Promise.resolve(phase.caller(snapshot))
        } catch (e) {
          return Promise.resolve(e)
        }
      }
      return Promise.race([
        onceProp(),
        onceWantedBroken(),
        // onceLogicStopped,
      ])
    }

    default:
      return null
  }
}
