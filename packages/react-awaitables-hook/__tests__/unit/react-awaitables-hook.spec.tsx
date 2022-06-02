/* eslint-disable no-constant-condition */
import { render, waitFor, act } from '@testing-library/react';

import { Tester, TestFlowScript, usingTestActions } from './Tester';

describe('ReactAwaitablesHook', () => {
  it('render successfully', async () => {
    const flowScript = jest.fn()
    const testerChildren = jest.fn() 

    const { baseElement } = render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);
    expect(baseElement).toBeTruthy();

    expect(flowScript).toBeCalled()
    expect(testerChildren).lastCalledWith({ title: 'loading...' }, expect.anything())
  });

  it('render direct state update', () => {
    const flowScript: TestFlowScript = ({ setState }) => {
      setState({ title: 'ready' })
    }
    const testerChildren = jest.fn() 

    render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);

    expect(testerChildren).nthCalledWith(1, { title: 'loading...' }, expect.anything())
    expect(testerChildren).nthCalledWith(2, { title: 'ready' }, expect.anything())
    expect(testerChildren).toBeCalledTimes(2)
  });

  it('render direct concurrent state updates', () => {
    const flowScript: TestFlowScript = ({ setState }) => {
      setState({ title: 'ready' })
      setState({ title: 'running..' })
      // batched updates make end up with the last one
    }
    const testerChildren = jest.fn() 

    render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);

    expect(testerChildren).nthCalledWith(1, { title: 'loading...' }, expect.anything())
    expect(testerChildren).nthCalledWith(2, { title: 'running..' }, expect.anything())
    expect(testerChildren).not.toHaveBeenCalledWith({ title: 'ready' }, expect.anything())
  });

  it('render in-sequence state updates (case 1)', async () => {
    const flowScript: TestFlowScript = async ({ setState }) => {
      await setState({ title: 'ready' })
      // ready was rendered! ..then
      setState({ title: 'running..' })
    }
    const testerChildren = jest.fn() 

    render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);

    expect(testerChildren).nthCalledWith(1, { title: 'loading...' }, expect.anything())
    expect(testerChildren).nthCalledWith(2, { title: 'ready' }, expect.anything())
    await waitFor(() => {
      expect(testerChildren).nthCalledWith(3, { title: 'running..' }, expect.anything())
    })
  });

  it('render in-sequence state updates (case 2)', async () => {
    const flowScript: TestFlowScript = async ({ setState }) => {
      for (let i = 1; i<=5; i+=1) {
        await setState({ title: `step ${i}` })
      }
      setState({ title: 'done' })
    }
    const testerChildren = jest.fn() 

    render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);

    await waitFor(() => {
      expect(testerChildren).lastCalledWith({ title: 'done' }, expect.anything())
    })
    expect(testerChildren).nthCalledWith(1, { title: 'loading...' }, expect.anything())
    for (let i = 1; i<=5; i+=1) {
        expect(testerChildren).nthCalledWith(i + 1, { title: `step ${i}` }, expect.anything())
    }
    expect(testerChildren).toBeCalledTimes(7)
  });

  it('render delayed state update', async () => {
    jest.useFakeTimers()
    try {
      const flowScript: TestFlowScript = async ({ setState, delay }) => {
        await delay(1000)
        setState({ title: 'hello' })
      }
      const testerChildren = jest.fn() 
  
      render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);
  
      act(() => { jest.advanceTimersByTime(1010) })

      expect(testerChildren).nthCalledWith(1, { title: 'loading...' }, expect.anything())
      await waitFor(() => {
        expect(testerChildren).nthCalledWith(2, { title: 'hello' }, expect.anything())
      })
      expect(testerChildren).toBeCalledTimes(2)
    }
    finally {
      jest.useRealTimers()
    }
  });

  it('render user-triggered state update', async () => {
    const flowScript: TestFlowScript = async ({ setState, untilAction }) => {
      const action = await untilAction('setName')
      await setState({ title: `user called action: [${action.actionId}] -- so, hello ${action.guessName}` })
      await setState({ title: 'done' })
    }
    const testerChildren = jest.fn() 

    render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);
    
    const testActions = usingTestActions(testerChildren)
    testActions.setName('Jorge')

    await waitFor(() => {
      expect(testerChildren).lastCalledWith({ title: 'done' }, expect.anything())
    })
    expect(testerChildren).nthCalledWith(1, { title: 'loading...' }, expect.anything())
    expect(testerChildren).nthCalledWith(2, { title: 'user called action: [setName] -- so, hello Jorge' }, expect.anything())
    expect(testerChildren).toBeCalledTimes(3)
  });

  it('render user-multi-choise-triggered state update', async () => {
    const flowScript: TestFlowScript = async ({ setState, untilAction }) => {
      let lastInLoopUpd = Promise.resolve()
      while (true) {
        const action = await untilAction(['accept', 'discard'])
        lastInLoopUpd = setState({ title: `user called action: [${action.actionId}]` })
        if (action.actionId === 'discard') break
      }
      await lastInLoopUpd // avoid batching post-discard triggered upd with the next (done)
      await setState({ title: 'done' })
    }
    const testerChildren = jest.fn() 

    render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);
    
    const testActions = usingTestActions(testerChildren)
    // await testActions.accept() // til next render
    // await testActions.discard() // til next render
    await act(() => { testActions.accept() }) // til next render
    await act(() => { testActions.discard() }) // til next render

    await waitFor(() => {
      expect(testerChildren).lastCalledWith({ title: 'done' }, expect.anything())
    })
    expect(testerChildren).nthCalledWith(1, { title: 'loading...' }, expect.anything())
    expect(testerChildren).nthCalledWith(2, { title: 'user called action: [accept]' }, expect.anything())
    expect(testerChildren).nthCalledWith(3, { title: 'user called action: [discard]' }, expect.anything())
    expect(testerChildren).toBeCalledTimes(4)
  });
});



