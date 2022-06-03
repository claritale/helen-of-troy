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
    jest.useFakeTimers()
    jest.clearAllMocks()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('render delayed state update', async () => {
    const flowScript: TestFlowScript = async ({ setState, delay }) => {
      await delay(1000)
      setState({ title: 'hello' })
    }

    render(<Tester flowScript={flowScript} options={options}>{testerChildren}</Tester>);

    // act(() => { jest.advanceTimersByTime(1010) })
    jest.advanceTimersByTime(1010)

    await waitFor(() => { expect(finishCb).toBeCalled() })

    expect(testerChildren).nthCalledWith(1, { title: 'loading...' }, expect.anything())
    expect(testerChildren).nthCalledWith(2, { title: 'hello' }, expect.anything())
    expect(testerChildren).toBeCalledTimes(2)
  });

  it('delay canceled by unmount', async () => {
    const flowScript: TestFlowScript = async ({ delay }) => {
      await delay(1000)
      throw new Error('boom!') // should be ignored
    }

    const { unmount } = render(<Tester flowScript={flowScript} options={options}>{testerChildren}</Tester>);

    unmount()

    await waitFor(() => { expect(finishCb).toBeCalled() })

    expect(logger.error).not.toBeCalled()
    expect(finishCb).toBeCalledWith({ reason: 'unmounted' })
  });
});



