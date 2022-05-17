
import { InferProps } from 'prop-types'

export const phaseTypes = {
  cancelled:        'cancelled',
  fork:             'fork',
  cancel:           'cancel',
  oncePromise:      'oncePromise',
  race:             'race',
  doAction:         'doAction',
  onAction:         'onAction',
  untilAction:      'untilAction',
  actionsEmitter:   'actionsEmitter',
  setState:         'setState',
  getState:         'getState',
  delay:            'delay',
  untilPropsChange: 'untilPropsChange',
  getProp:          'getProp',
  callProp:         'callProp',
}

export const noOp = () => {/* ignored */}

type YieldablePhase<TReturn> = Generator<any, TReturn, any>

type AnyFuncion = (...args: any[]) => any

type Bag<T> = T extends any[] | AnyFuncion | number | string | boolean
  ? false
  : [T] extends [null | undefined]
  ? false
  : true
type CondKeys<O, Cond> = {
  [k in keyof O]: O[k] extends Cond
    ? k
    : Bag<O[k]> extends true
    ? [CondKeys<O[k], Cond>] extends [never]
      ? never
      : k
    : never
}[keyof O]
type RecursivePick<O, C> = Pick<
  {
    [k in keyof O]: Bag<O[k]> extends true ? (O[k] extends C ? O[k] : RecursivePick<O[k], C>) : O[k]
  },
  CondKeys<O, C>
>

type StateUpdater<Shape> = (state: Shape) => Partial<Shape>

type Params<Fn> = Fn extends (...params: infer T) => any ? T : never
type ActionsPhases<Shape> = {
  [A in keyof Shape]: (...params: Params<Shape[A]>) => YieldablePhase<void>
}
type ActionsToEmit<Shape> = {
  [A in keyof Shape]: (...params: Params<Shape[A]>) => void
}
type ActionsPayloads<Shape> = {
  [A in keyof Shape | 'ANY']: (Shape & { ['ANY']: unknown })[A] extends (...args: any[]) => infer R
    ? R & { actionKey: A }
    : { actionKey: A }
}
export type ActionPayload<ActionsShape, A extends keyof ActionsShape> = ActionsPayloads<ActionsShape>[A]

const Defer = () => {
  const d: any = {}
  d.promise = new Promise((resolve, reject) => {
    d.resolve = resolve
    d.reject = reject
  })
  d.promise.catch(noOp)
  return d
}

class ShapesHelper<PropsTypes extends object, StateShape extends object, ActionsShape extends object> {
  public constructor(_shapes?: {
    propsTypes: PropsTypes;
    stateShape: StateShape;
    actionsShape?: ActionsShape
  }) {
    this.onActionFork = this.onActionFork.bind(this)
    this.ActionsQueue = this.ActionsQueue.bind(this)
  }

  public fromProps = new (class FromPropsHelper {
    onChange<T>(selector: (props: PropsTypes) => T): YieldablePhase<T>;

    onChange<T>(
      selector: (props: PropsTypes) => T,
      changedIf?: (curr: T, prev: T) => boolean
    ): YieldablePhase<T>;

    onChange<T>(selector: (props: PropsTypes) => T, changedIf?: (curr: T, prev: T) => boolean) {
      function* phaseGen(): YieldablePhase<T> {
        return yield {
          type:      phaseTypes.untilPropsChange,
          selector,
          changedIf: changedIf || ((a, b) => a !== b),
        }
      }
      return phaseGen()
    }

    call<T>(caller: (props: RecursivePick<PropsTypes, AnyFuncion>) => T) {
      function* phaseGen(): YieldablePhase<T> {
        return yield {
          type: phaseTypes.callProp,
          caller,
        }
      }
      return phaseGen()
    }

    select<T>(selector: (state: PropsTypes) => T) {
      function* phaseGen(): YieldablePhase<T> {
        return yield {
          type: phaseTypes.getProp,
          selector,
        }
      }
      return phaseGen()
    }

    getByKey<Key extends keyof PropsTypes>(propKey: Key) {
      function* phaseGen(): YieldablePhase<PropsTypes[Key]> {
        return yield {
          type: phaseTypes.getProp,
          propKey,
        }
      }
      return phaseGen()
    }
  })()

  public fromState = new (class FromStateHelper {
    select<T>(selector: (state: StateShape) => T) {
      function* phaseGen(): YieldablePhase<T> {
        return yield {
          type: phaseTypes.getState,
          selector,
        }
      }
      return phaseGen()
    }

    getByKey<Key extends keyof StateShape>(stateKey: Key) {
      function* phaseGen(): YieldablePhase<StateShape[Key]> {
        return yield {
          type: phaseTypes.getState,
          stateKey,
        }
      }
      return phaseGen()
    }
  })()

  public setState(stateOrUpdater: Partial<StateShape> | StateUpdater<StateShape>) {
    function* phaseGen(): YieldablePhase<boolean> {
      return yield {
        type: phaseTypes.setState,
        stateOrUpdater,
      }
    }
    return phaseGen()
  }

  public actions = new Proxy<ActionsPhases<ActionsShape>>({} as ActionsPhases<ActionsShape>, {
    get: (_, actionKey) => (...params: any[]): YieldablePhase<void> => {
      function* phaseGen(): YieldablePhase<void> {
        return yield {
          type: phaseTypes.doAction,
          actionKey,
          params,
        }
      }
      return phaseGen()
    },
  })

  public actionsEmitter(emitterSubscriber: (emit: ActionsToEmit<ActionsShape>) => AnyFuncion) {
    function* phaseGen(): YieldablePhase<void> {
      return yield {
        type: phaseTypes.actionsEmitter,
        emitterSubscriber,
      }
    }
    return phaseGen()
  }

  public untilAction<K extends keyof ActionsShape>(waitingFor: 'ANY' | K | K[]) {
    function* phaseGen(): YieldablePhase<ActionPayload<ActionsShape, K>> {
      return yield {
        type: phaseTypes.untilAction,
        waitingFor,
      }
    }
    return phaseGen()
  }

  public ActionsQueue<K extends keyof ActionsShape>(actionKey: 'ANY' | K | K[]) {
    function* phaseGen(): YieldablePhase<{
      dequeue: (andFlush?: boolean) => Generator<any, ActionPayload<ActionsShape, K>, any>,
      flush: () => ActionPayload<ActionsShape, K>[]
      end: AnyFuncion
    }> {
      const state: any = {
        queue:        [],
        enqueueDefer: Defer(),
      }

      const enqueue = (error: any, action: any) => {
        state.queue.push([error, action])
        state.enqueueDefer.resolve()
      }

      const unsubscribe = yield {
        type: phaseTypes.onAction,
        actionKey,
        enqueue,
      }

      function* dequeuing(andFlush: any) {
        while (state.queue.length === 0) {
          yield* once(state.enqueueDefer.promise)
          state.enqueueDefer = Defer()
        }
        const [error, action] = state.queue.splice(0, andFlush ? state.queue.length : 1)[0]
        if (error) throw error
        return action
      }

      return {
        dequeue: (andFlush = false) => dequeuing(andFlush),
        flush:   () => state.queue.splice(0),
        end:     unsubscribe,
      }
    }
    return phaseGen()
  }

  public onActionFork<K extends keyof ActionsShape>(
    actionKey: K,
    subTaskGen: (action: ActionPayload<ActionsShape, K>, ...args: any[]) => Generator,
    ...args: any[]
  ) {
    const { untilAction } = this
    return fork(function* onActionFork() {
      while (true) {
        const actionInst = yield* untilAction<K>(actionKey)
        yield* fork(subTaskGen, actionInst, ...args)
      }
    })
  }
}

export type PropsTypes<V> = InferProps<V>

export function applyIoPhasesShapes<P extends object, S extends object, A extends object>(shapes?: {
  propsShape: P
  stateShape: S
  actionsShape?: A
}): ShapesHelper<PropsTypes<P>, S, A> {
  return new ShapesHelper<PropsTypes<P>, S, A>(shapes as any)
}

interface CancelledStatus {
  cancelled: { unmounted: boolean }
  error: null | Error
}

/**
 * @generator
 * @description phase to check whether the logic was cancelled. the logic initiated via start phase
 * @yields {CancelledStatus}
 */
export function cancelled() {
  function* phaseGen(): YieldablePhase<CancelledStatus> {
    return yield {
      type: phaseTypes.cancelled,
    }
  }
  return phaseGen()
}

type SubTaskGenerator = (...params: any[]) => Generator
export interface Task {
  taskId: number
}

/**
 * @generator
 * @description phase to start a logic sub task. the task is started but not awaited
 * @param {SubTaskGenerator} subTaskGen the sub task generator to start
 * @param {...any} subTaskParams parameters passed to the sub task generator
 * @yields {Task}
 */
export function fork<G extends SubTaskGenerator>(subTaskGen: G, ...subTaskParams: Params<G>) {
  function* phaseGen(): YieldablePhase<Task> {
    return yield {
      type: phaseTypes.fork,
      subTaskGen,
      subTaskParams,
    }
  }
  return phaseGen()
}

/**
 * @generator
 * @description phase to wait for a promise to settle
 * @param {Promise<T>} promise promise to await.
 * @yields {T}
 */
export function once<T>(promise: Promise<T>) {
  function* phaseGen(): YieldablePhase<T> {
    return yield {
      type: phaseTypes.oncePromise,
      promise,
    }
  }
  return phaseGen()
}

type RacersMap = {
  [racerKey: string]: YieldablePhase<unknown>
}

type RacersResults<rMap extends RacersMap> = {
  [rK in keyof rMap]: rMap[rK] extends YieldablePhase<infer R> ? { result: R } & { winner: rK } : never
}
type RaceResult<M> = M extends { [x: string]: infer V } ? V : never

/**
 * @generator
 * @description phase to wait for the winner of 2 or more phases
 * @param {RacersMap} racersMap map of racing phases indicated by given each key.
 *                              the key and result of the winner phase is returned
 * @yields {Partial<RacersMap>}
 * @example
 *  yield* race({
 *    anyAction: untilAction(),
 *    timeout: delay(3000)
 *  })
 */
export function race<M extends RacersMap>(racersMap: M) {
  function* phaseGen(): YieldablePhase<RaceResult<RacersResults<M>>> {
    return yield {
      type:      phaseTypes.race,
      racersMap: Object.entries(racersMap).reduce((m, [rK, rY]) => Object.assign(m, { [rK]: rY.next().value }), {}),
    }
  }
  return phaseGen()
}

/**
 * @generator
 * @description phase to cancel a logic initiated via start phase
 * @param {Task} subTask sub task to cancel. if the task is cancelled, this is no-op
 */
export function cancel(subTask: Task) {
  function* phaseGen(): YieldablePhase<void> {
    return yield {
      type: phaseTypes.cancel,
      subTask,
    }
  }
  return phaseGen()
}

/**
 * @generator
 * @description phase to pause for a time (ms)
 * @param {number} time miliseconds to pause
 */
export function delay(time: number) {
  function* phaseGen(): YieldablePhase<boolean> {
    return yield {
      type: phaseTypes.delay,
      time,
    }
  }
  return phaseGen()
}
