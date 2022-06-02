/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-constant-condition */
import { render, waitFor } from '@testing-library/react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  it('render direct state update', () => {
    const flowScript: TestFlowScript = ({ setState }) => {
      setState({ title: 'ready' })
    }

    render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);

    expect(testerChildren).nthCalledWith(1, { title: 'loading...' }, expect.anything())
    expect(testerChildren).nthCalledWith(2, { title: 'ready' }, expect.anything())
    expect(testerChildren).toBeCalledTimes(2)
  });

  it('render direct concurrent state updates', () => {
    const flowScript: TestFlowScript = ({ setState }) => {
      setState({ title: 'ready' })
      setState({ title: 'running..' })
      // batched updates end up with only the last one being rendered
    }

    render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);

    expect(testerChildren).nthCalledWith(1, { title: 'loading...' }, expect.anything())
    expect(testerChildren).nthCalledWith(2, { title: 'running..' }, expect.anything())
    expect(testerChildren).not.toBeCalledWith({ title: 'ready' }, expect.anything())
  });

  it('render in-sequence state updates (case 1)', async () => {
    const flowScript: TestFlowScript = async ({ setState }) => {
      await setState({ title: 'ready' })
      // upd (ready) was rendered! ..then
      setState({ title: 'running..' })
    }
    
    render(<Tester flowScript={flowScript} options={options}>{testerChildren}</Tester>);

    await waitFor(() => { expect(finishCb).toBeCalled() })

    expect(testerChildren).nthCalledWith(1, { title: 'loading...' }, expect.anything())
    expect(testerChildren).nthCalledWith(2, { title: 'ready' }, expect.anything())
    expect(testerChildren).nthCalledWith(3, { title: 'running..' }, expect.anything())
  });

  it('render in-sequence state updates (case 2)', async () => {
    const flowScript: TestFlowScript = async ({ setState }) => {
      for (let i = 1; i<=5; i+=1) {
        await setState({ title: `step ${i}` })
      }
      setState({ title: 'done' })
    }

    render(<Tester flowScript={flowScript} options={options}>{testerChildren}</Tester>);

    await waitFor(() => { expect(finishCb).toBeCalled() })
    
    expect(testerChildren).nthCalledWith(1, { title: 'loading...' }, expect.anything())
    for (let i = 1; i<=5; i+=1) {
        expect(testerChildren).nthCalledWith(i + 1, { title: `step ${i}` }, expect.anything())
    }
    expect(testerChildren).lastCalledWith({ title: 'done' }, expect.anything())
    expect(testerChildren).toBeCalledTimes(7)
  });
});



