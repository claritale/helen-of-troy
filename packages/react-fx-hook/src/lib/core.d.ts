/**
 * @typedef {import('./phases').ActionFn} ActionFn
 */
 export declare class HookCore {
  /**
   * @constructor
   * @param {Object.<string,any>} initialState - initialize state used by your logic
   * @param {Object.<string,ActionFn>} actionsMap
   * @param {() => void} reRender
   */
  constructor(initialState: any, actionsMap: any, reRender: any, enableLogs?: boolean);
  get actions(): any;
  startLogic(logicGen: any, onFinish: any): void;
  usingProps(currentProps: any): void;
}