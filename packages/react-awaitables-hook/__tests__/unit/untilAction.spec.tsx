/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-constant-condition */
import { render, waitFor, act } from '@testing-library/react';

import { Tester, TestFlowScript, usingTestActions } from './Tester';
import { HookOptions } from '../../src/lib/hook';

describe('ReactAwaitablesHook', () => {
  const finishCb = jest.fn()
  const logger: Console = { error: jest.fn() } as any
  const options: HookOptions = { finishCb, logger }
  const testerChildren = jest.fn() 

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('render user-triggered state update', async () => {
    const flowScript: TestFlowScript = async ({ setState, untilAction }) => {
      const action = await untilAction('setName')
      await setState({ title: `user called action: [${action.actionId}] -- so, hello ${action.guessName}` })
      await setState({ title: 'done' })
    }

    render(<Tester flowScript={flowScript} options={options}>{testerChildren}</Tester>);
    
    const testActions = usingTestActions(testerChildren)
    testActions.setName('Jorge')

    await waitFor(() => { expect(finishCb).toBeCalled() })

    expect(testerChildren).nthCalledWith(1, { title: 'loading...' }, expect.anything())
    expect(testerChildren).nthCalledWith(2, { title: 'user called action: [setName] -- so, hello Jorge' }, expect.anything())
    expect(testerChildren).lastCalledWith({ title: 'done' }, expect.anything())
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

    render(<Tester flowScript={flowScript} options={options}>{testerChildren}</Tester>);
    
    const testActions = usingTestActions(testerChildren)
    // await testActions.accept() // til next render
    // await testActions.discard() // til next render
    await act(() => { testActions.accept() }) // til next render
    await act(() => { testActions.discard() }) // til next render

    await waitFor(() => { expect(finishCb).toBeCalled() })

    expect(testerChildren).nthCalledWith(1, { title: 'loading...' }, expect.anything())
    expect(testerChildren).nthCalledWith(2, { title: 'user called action: [accept]' }, expect.anything())
    expect(testerChildren).nthCalledWith(3, { title: 'user called action: [discard]' }, expect.anything())
    expect(testerChildren).lastCalledWith({ title: 'done' }, expect.anything())
    expect(testerChildren).toBeCalledTimes(4)
  });
});



