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
 export declare function useLogic(setup: any, currentProps: any): any[];