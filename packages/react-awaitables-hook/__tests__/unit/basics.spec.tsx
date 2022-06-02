/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-constant-condition */

import { render, waitFor } from '@testing-library/react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Tester, TestFlowScript } from './Tester';
import { HookOptions } from '../../src/lib/hook';

describe('ReactAwaitablesHook', () => {
  it('render successfully', async () => {
    const flowScript = jest.fn()
    const testerChildren = jest.fn() 

    const { baseElement } = render(<Tester flowScript={flowScript}>{testerChildren}</Tester>);
    expect(baseElement).toBeTruthy();

    expect(flowScript).toBeCalled()
    expect(testerChildren).lastCalledWith({ title: 'loading...' }, expect.anything())
  });

  it('on finish callback', async () => {
    const flowScript = jest.fn()
    const finishCb = jest.fn()
    const options: HookOptions = { finishCb }
    const testerChildren = jest.fn() 

    render(<Tester flowScript={flowScript} options={options}>{testerChildren}</Tester>);

    await waitFor(() => {
      expect(finishCb).toBeCalledTimes(1)
      expect(finishCb).toBeCalledWith(false)
    })
  });

  it('finish cb - canceled with sync error', async () => {
    const flowScript = () => {
      throw new Error('boom!')
    }
    const finishCb = jest.fn()
    const logger: Console = { error: jest.fn() } as any
    const options: HookOptions = { finishCb, logger }
    const testerChildren = jest.fn() 

    render(<Tester flowScript={flowScript} options={options}>{testerChildren}</Tester>);

    await waitFor(() => { expect(finishCb).toBeCalled() })
    expect(logger.error).toBeCalledWith('Error running the flow ->', new Error('boom!'))
    expect(finishCb).toBeCalledWith({ reason: 'error', error: new Error('boom!') })
  });
});



