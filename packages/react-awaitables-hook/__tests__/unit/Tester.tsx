import React from 'react';
import { TestingActionsToCall } from '../../src/lib/core';
import { useAwaitables, FlowScript, FinishCb } from '../../src/lib/hook';


/**
 *  A component that expects props to have a flowScript to be run and a callable children,
 *  which will be called with with refs to curr state and actions fns
 */
 interface TesterProps {
  flowScript: TestFlowScript;
  options?: { onFinish?: FinishCb; logger?: Console; },
  children: (...args: unknown[]) => ReturnType<React.FC>;
}
export const Tester: React.FC<TesterProps> = ({ flowScript, options = {}, children }) => {
  const { flowRunner, state, actions } = useAwaitables(initialState, actionsMap, options);
  flowRunner(flowScript);
  return children(state, actions);
};

interface StateShape {
  title: string;
}
const initialState: StateShape = { title: 'loading...' };

const actionsMap = {
  setName: (name: string) => ({ guessName: name }),
  accept: () => ({}),
  discard: () => ({})
};
type ActionsMap = typeof actionsMap;

export type TestFlowScript = FlowScript<StateShape, ActionsMap>;

export function usingTestActions(testerChildren: jest.Mock): TestingActionsToCall<ActionsMap> {
  return testerChildren.mock.calls[0][1];
}

