import { render, screen, waitFor } from '@testing-library/react';

import {useAwaitables} from '../../src/lib/react-awaitables-hook';

describe('ReactAwaitablesHook', () => {
  it('should render successfully', async () => {
    const { baseElement } = render(<Tester />);
    expect(baseElement).toBeTruthy();

    expect(screen.getByTestId('title-display').innerHTML).toEqual('loading...')
    
    await waitFor(() => {
      expect(screen.getByTestId('title-display').innerHTML).toEqual('hello')
    })
  });
});

function Tester() {
  const { flowRunner, state, setState } = useAwaitables({ title: 'loading...' })

  flowRunner(async () => {
      await setState({ title: 'hello' })
  })

  return (
    <div data-testid='title-display'>{state.title}</div>
  )
}