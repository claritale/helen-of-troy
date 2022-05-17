/* eslint-disable no-continue */
/* eslint-disable no-console */
import { logicPhases } from '@claritale/react-fx-hook'

const {
  applyIoPhasesShapes,
  fork,
  delay,
} = logicPhases

let nextId = 1
export const getUniqueId = () => {
  // eslint-disable-next-line no-plusplus
  const id = nextId++
  return id
}

const sampleTodosTemplate = [
  { text: 'task 1 - lorem ipsum sum rem iplon loip srem', done: false, locked: false },
  { text: 'task 2 - lorem ipsum sum rem iplon loip srem', done: true, locked: true },
  { text: 'task 3', done: false, locked: false },
]
const copyTasks = (templ) => templ.map((t) => ({ ...t, id: t.id || getUniqueId() }))

/**
 * @typedef {Object} Task
 * @property {number} id
 * @property {string} text
 * @property {boolean} done
 * @property {boolean} locked
 *
 * @typedef {Object} Todos
 * @property {number} id
 * @property {string} title
 * @property {Task[]} tasks
 * @property {string} saveError
 *
 * @typedef {Object} StateShape
 * @property {Todos[]} savedTodosList
 * @property {string} inputErrorMsg
 */

/**
 * @type {StateShape}
 */
export const AppInitialState = {
  savedTodosList: [
    // {
    //   id: getUniqueId(),
    //   title: 'Sample todos',
    //   tasks: copyTasks(sampleTodosTemplate),
    //   saveError: ''
    // }
  ],
  inputErrorMsg: '',
}

export const AppActions = {
  /**
   * @param {string} newTitle
   */
  newTodos:   (newTitle) => ({ newTitle }),
  /**
   * @param {number} todosId
   * @param {string} titleText
   */
  saveTitle:  (todosId, titleText) => ({ todosId, titleText }),
  /**
   * @param {number} todosId
   * @param {Task[]} tasksState
   */
  saveTasks:  (todosId, tasksState) => ({ todosId, tasksState }),
  /**
   * @param {number} id
   */
  closeTodos: (id) => ({ id }),
}

const { untilAction, fromState, setState } = applyIoPhasesShapes({
  stateShape:   AppInitialState,
  actionsShape: AppActions,
})

export function* AppLogic() {
  yield* fork(todosAdditionLogic)
  yield* fork(todosSavingLogic)
  yield* fork(todosClosingLogic)

  console.log('app logic running!')
}

class ValidationError extends Error {}

function* validateTodosTitle(text) {
  const inputErrorMsg = yield* fromState.select((s) => s.inputErrorMsg)

  if (inputErrorMsg) {
    yield* setState({ inputErrorMsg: '' })
    yield* delay(200)
  }

  if (!text) {
    throw new ValidationError('title required')
  }

  const todosList = yield* fromState.select((s) => s.savedTodosList)

  if (todosList.some((x) => x.title === text)) {
    throw new ValidationError('can not duplicate todos titles')
  }

  if (inputErrorMsg) {
    yield* setState({ inputErrorMsg: '' })
  }
}

function* todosAdditionLogic() {
  const addingNewTodos = (title, todosList) => [
    ...todosList,
    {
      id:        getUniqueId(),
      title,
      tasks:     copyTasks(sampleTodosTemplate),
      saveError: '',
    },
  ]

  while (true) {
    try {
      const { newTitle } = yield* untilAction('newTodos')

      yield* validateTodosTitle(newTitle)

      yield* setState(({ savedTodosList }) => ({
        savedTodosList: addingNewTodos(newTitle, savedTodosList),
      }))
    } catch (e) {
      if (e.constructor !== ValidationError) throw e
      yield* setState({ inputErrorMsg: e.message })
    }
  }
}

function* todosSavingLogic() {
  const savingTodosAtIndex = (idx, update, todosList) => [
    ...todosList.slice(0, idx),
    {
      ...todosList[idx],
      ...update,
    },
    ...todosList.slice(idx + 1),
  ]

  while (true) {
    const action = yield* untilAction(['saveTitle', 'saveTasks'])

    const idx = yield* fromState.select((s) => s.savedTodosList.findIndex((x) => x.id === action.todosId))
    if (idx < 0) continue // this shouldn't happen :/

    switch (action.actionKey) {
      case 'saveTitle': {
        yield* setState(({ savedTodosList }) => {
          let update
          if (savedTodosList.some((x, xIdx) => xIdx !== idx && x.title === action.titleText)) {
            update = { saveError: 'Can not duplicate todos titles' }
          } else {
            update = { title: action.titleText }
          }
          return { savedTodosList: savingTodosAtIndex(idx, update, savedTodosList) }
        })
        break
      }

      case 'saveTasks': {
        yield* setState(({ savedTodosList }) => ({
          savedTodosList: savingTodosAtIndex(
            idx,
            { tasks: copyTasks(action.tasksState) },
            savedTodosList,
          ),
        }))
        break
      }

      default:
        break
    }
  }
}

function* todosClosingLogic() {
  const closingTodosWithId = (todosId, todosList) => todosList.filter((x) => x.id !== todosId)

  while (true) {
    const { id } = yield* untilAction('closeTodos')

    yield* setState(({ savedTodosList }) => ({
      savedTodosList: closingTodosWithId(id, savedTodosList),
    }))
  }
}
