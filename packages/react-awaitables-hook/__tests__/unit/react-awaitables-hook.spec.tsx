import { render, waitFor, act } from '@testing-library/react';
import React from 'react';

import {useAwaitables, FlowScript, createDefer} from '../../src/lib/react-awaitables-hook';

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

  it('render direct concurrent state updates', () => {
    const flowScript: FlowScript<StateShape> = ({ setState }) => {
      setState({ title: 'ready' })
      setState({ title: 'running..' })
      // batched updates make end up with the last one
    }
    const testerChildren = jest.fn() 

    render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);

    expect(testerChildren).toHaveBeenNthCalledWith(1, { title: 'loading...' })
    expect(testerChildren).toHaveBeenNthCalledWith(2, { title: 'running..' })
  });

  it('render in-sequence state updates (case 1)', async () => {
    const flowScript: FlowScript<StateShape> = async ({ setState }) => {
      await setState({ title: 'ready' })
      // ready was rendered! ..then
      setState({ title: 'running..' })
    }
    const testerChildren = jest.fn() 

    render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);

    expect(testerChildren).toHaveBeenNthCalledWith(1, { title: 'loading...' })
    expect(testerChildren).toHaveBeenNthCalledWith(2, { title: 'ready' })
    await waitFor(() => {
      expect(testerChildren).toHaveBeenNthCalledWith(3, { title: 'running..' })
    })
  });

  it('render in-sequence state updates (case 2)', async () => {
    const flowScript: FlowScript<StateShape> = async ({ setState }) => {
      for (let i = 1; i<=5; i+=1) {
        await setState({ title: `step ${i}` })
      }
      setState({ title: 'done' })
    }
    const testerChildren = jest.fn() 

    render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);

    await waitFor(() => {
      expect(testerChildren).toHaveBeenLastCalledWith({ title: 'done' })
    })
    expect(testerChildren).toHaveBeenCalledTimes(7)
    expect(testerChildren).toHaveBeenNthCalledWith(1, { title: 'loading...' })
    for (let i = 1; i<=5; i+=1) {
        expect(testerChildren).toHaveBeenNthCalledWith(i + 1, { title: `step ${i}` })
    }
  });

  it('render delayed state update', async () => {
    jest.useFakeTimers()
    try {
      const flowScript: FlowScript<StateShape> = async ({ setState, delay }) => {
        await delay(1000)
        setState({ title: 'hello' })
      }
      const testerChildren = jest.fn() 
  
      render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);
  
      act(() => { jest.advanceTimersByTime(1010) })

      expect(testerChildren).nthCalledWith(1, { title: 'loading...' })
      await waitFor(() => {
        expect(testerChildren).nthCalledWith(2, { title: 'hello' })
      })
    }
    finally {
      jest.useRealTimers()
    }
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
