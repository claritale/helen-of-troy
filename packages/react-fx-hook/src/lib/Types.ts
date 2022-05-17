/* eslint-disable no-unused-vars */
import { ActionPayload as AP } from './phases'

export interface FinishState {
  canceled: false | { unmounted: boolean }
  error: Error
}

export type LogicFinishCb = (finishState: FinishState) => void

export declare type LogicSetup<StateShape, ActionsShape> = {
  mainLogicGen: () => Generator
  initialState: StateShape
  actionsMap: ActionsShape
  onFinish?: LogicFinishCb
  enableLogs?: boolean
}

export type ActionPayload<ActionsShape, ActionKey extends keyof ActionsShape> = AP<ActionsShape, ActionKey>
