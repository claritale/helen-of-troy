import { render, waitFor } from '@testing-library/react';
import React from 'react';

import {useAwaitables, FlowScript} from '../../src/lib/react-awaitables-hook';

describe('ReactAwaitablesHook', () => {
  it('render successfully', async () => {
    const flowScript = jest.fn()
    const testerChildren = jest.fn() 

    const { baseElement } = render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);
    expect(baseElement).toBeTruthy();

    expect(flowScript).toBeCalled()
    expect(testerChildren).lastCalledWith({ title: 'loading...' })
  });

  it('render direct state update', () => {
    const flowScript: FlowScript<StateShape> = ({ setState }) => {
      setState({ title: 'ready' })
    }
    const testerChildren = jest.fn() 

    render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);

    expect(testerChildren).toHaveBeenNthCalledWith(1, { title: 'loading...' })
    expect(testerChildren).toHaveBeenNthCalledWith(2, { title: 'ready' })
  });

  it('render delayed state update', async () => {
    const flowScript: FlowScript<StateShape> = async ({ setState, delay }) => {
      await delay(100)
      setState({ title: 'hello' })
    }
    const testerChildren = jest.fn() 

    render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);

    expect(testerChildren).nthCalledWith(1, { title: 'loading...' })
    await waitFor(() => {
      expect(testerChildren).nthCalledWith(2, { title: 'hello' })
    })
  });
});

/**
 *  A component that expects to have a callable children, 
 *  which will receive an object with refs to curr state and actions fns
 */
const Tester: React.FC<TesterProps> = ({ flowScript, children }) => {
  const { flowRunner, state } = useAwaitables(
    initialState,
    { setName: (name: string) => ({ guessName: name }) }
  )
  flowRunner(flowScript)
  return children(state)
}

interface StateShape {
  title: string
}
const initialState: StateShape = { title: 'loading...' }

interface TesterProps {
  flowScript: FlowScript<StateShape> 
  children: (...args: unknown[]) => ReturnType<React.FC>
}
