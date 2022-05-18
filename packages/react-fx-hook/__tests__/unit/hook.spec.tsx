/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'

import { useLogic, LogicSetup, logicPhases } from '../../src';

describe('ReactFxHook', () => {
  it('should render initial state successfully', () => {
    const { baseElement } = render(<HookTester />);

    expect(baseElement).toBeTruthy();
    // correct initial title
    expect(screen.getByTestId('title-display')).toHaveTextContent('starting')
    // correct intial options
    const activeOptions = screen.getAllByTestId('option-selector')
    expect(activeOptions).toHaveLength(1)
    expect(activeOptions[0]).toHaveTextContent('start')
  });

  it('should update/render state after first user action', async () => {
    render(<HookTester />);

    // select active action
    await userEvent.click(screen.getByTestId('option-selector'))

    // correct title
    expect(screen.getByTestId('title-display')).toHaveTextContent('choices...')
    // correct intial options
    const activeOptions = screen.getAllByTestId('option-selector')
    expect(activeOptions).toHaveLength(2)
    expect(activeOptions[0]).toHaveTextContent('do callback 1')
    expect(activeOptions[1]).toHaveTextContent('do callback 2')
  });

  it('should update/render state after second user action', async () => {
    const cb1 = jest.fn()
    const cb2 = jest.fn()
    render(<HookTester someCallback={cb1} otherCallback={cb2}/>);

    // select 1st active action
    await userEvent.click(screen.getByTestId('option-selector'))
    // select 2nd active action
    await userEvent.click(screen.getByText('do callback 2'))

    // wait for correct final title
    await screen.findByText('completed')
    // correct intial options
    const activeOptions = screen.queryAllByTestId('option-selector')
    expect(activeOptions).toHaveLength(0)
    // correct callback called
    expect(cb1).toBeCalledTimes(0)
    expect(cb2).toBeCalledTimes(1)
  });
});

// -----------------------
// Test helpers

interface PropsShape {
  someCallback?: () => void
  otherCallback?: () => void
}
type Option = 'Option1' | 'Option2'
interface StateShape {
  title: string;
  options: Array<{ id: Option, label: string }>
}
interface ActionsShape {
  selectOption: (optId: Option) => { optId: Option }
}

const setup: LogicSetup<StateShape, ActionsShape> = {
  mainLogicGen: testLogic,
  initialState: { title: 'starting', options: [{ id: 'Option1', label: 'start' }] },
  actionsMap: { selectOption: (optId: Option) => ({ optId }) }
}

function HookTester(props: PropsShape) {
  const [state, actions] = useLogic(setup, props)
  return (
    <div>
      <span data-testid="title-display">{state.title}</span>
      {state.options.map((opt: any) => (
        <button 
          key={opt.id} 
          data-testid="option-selector"
          onClick={() => actions.selectOption(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

const { untilAction, setState, fromProps } = logicPhases.applyIoPhasesShapes<PropsShape, StateShape, ActionsShape>()

function* testLogic() {
  yield* untilAction('selectOption')

  yield* setState({ 
    title: 'choices...',
    options: [
      { id: 'Option1', label: 'do callback 1' },
      { id: 'Option2', label: 'do callback 2' },
    ]
  })

  const { optId } = yield* untilAction('selectOption')

  if (optId === 'Option1') {
    yield* fromProps.call((p) => p.someCallback())
  } else {
    yield* fromProps.call((p) => p.otherCallback())
  }

  yield* setState({ 
    title: 'completed',
    options: []
  })
}