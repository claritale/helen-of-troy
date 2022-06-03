/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-constant-condition */

import { render, waitFor } from '@testing-library/react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Tester, TestFlowScript } from './Tester';
import { HookOptions } from '../../src/lib/hook';

describe('ReactAwaitablesHook', () => {
  const finishCb = jest.fn()
  const logger: Console = { error: jest.fn() } as any
  const options: HookOptions = { finishCb, logger }
  const testerChildren = jest.fn() 

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('render successfully', async () => {
    const flowScript = jest.fn()

    const { baseElement } = render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);
    expect(baseElement).toBeTruthy();

    expect(flowScript).toBeCalled()
    expect(testerChildren).lastCalledWith({ title: 'loading...' }, expect.anything())
  });

  it('finish cb - simply finished (not canceled)', async () => {
    const flowScript = jest.fn()

    render(<Tester flowScript={flowScript} options={options}>{testerChildren}</Tester>);

    await waitFor(() => {
      expect(finishCb).toBeCalledTimes(1)
      expect(finishCb).toBeCalledWith(false)
    })
  });

  it('finish cb - canceled by unmount', async () => {
    const flowScript = async () => {
      await new Promise((done) => setTimeout(done, 100))
      throw new Error('boom!') // should be ignored
    }

    const { unmount } = render(<Tester flowScript={flowScript} options={options}>{testerChildren}</Tester>);

    unmount()

    await waitFor(() => { expect(finishCb).toBeCalled() })

    expect(logger.error).not.toBeCalled()
    expect(finishCb).toBeCalledWith({ reason: 'unmounted' })
  });

  it('finish cb - canceled by sync error', async () => {
    const flowScript = () => {
      throw new Error('boom!')
    }

    render(<Tester flowScript={flowScript} options={options}>{testerChildren}</Tester>);

    await waitFor(() => { expect(finishCb).toBeCalled() })

    expect(logger.error).toBeCalledWith('Catched Error running the Flow ->', new Error('boom!'))
    expect(finishCb).toBeCalledWith({ reason: 'error', error: new Error('boom!') })
  });

  it('finish cb - canceled by async error', async () => {
    const flowScript = async () => {
      await new Promise((done) => setTimeout(done, 100))
      throw new Error('boom!')
    }

    render(<Tester flowScript={flowScript} options={options}>{testerChildren}</Tester>);

    await waitFor(() => { expect(finishCb).toBeCalled() })

    expect(logger.error).toBeCalledWith('Catched Error running the Flow ->', new Error('boom!'))
    expect(finishCb).toBeCalledWith({ reason: 'error', error: new Error('boom!') })
  });
});



