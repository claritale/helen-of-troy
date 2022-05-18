/* eslint-disable max-classes-per-file */
/* eslint-disable no-continue */
/* eslint-disable no-console */
import PropTypes from 'prop-types'
import { logicPhases } from '@claritale/react-fx-hook'

const {
  applyIoPhasesShapes,
  fork,
  race,
  delay,
} = logicPhases

let nextToastId = 1
const getToastTodoId = () => {
  // eslint-disable-next-line no-plusplus
  const id = nextToastId++
  return id
}

export const TodoPropTypes = {
  title: PropTypes.string.isRequired,
  tasks: PropTypes.arrayOf(PropTypes.shape({
    id:     PropTypes.number.isRequired,
    text:   PropTypes.string.isRequired,
    done:   PropTypes.bool.isRequired,
    locked: PropTypes.bool.isRequired,
  })),
  saveTitle:   PropTypes.func.isRequired,
  saveTasks:   PropTypes.func.isRequired,
  saveError:   PropTypes.string,
  getUniqueId: PropTypes.func.isRequired,
  onClose:     PropTypes.func,
}

/**
 * @typedef {Object} Task
 * @property {number} id
 * @property {string} text
 * @property {boolean} done
 * @property {boolean} locked
 */

/**
 * @typedef {Object} Toast
 * @property {boolean} visible
 * @property {('info' | 'error')} [type]
 * @property {string} text
 * @property {boolean} [autoHide]
 */

/**
 * @typedef {Object} StateShape
 * @property {string} addErrorMsg
 * @property {number} openedOptsTodoId
 * @property {string} editingPlace
 * @property {string} editErrorMsg
 * @property {Object.<number, Toast>} toasts
 */

/**
 * @type {StateShape}
 */
export const TodoInitialState = {
  // tasks:         [],
  editingTitle:     false,
  addErrorMsg:      '',
  openedOptsTodoId: 0,
  editingPlace:     '',
  editErrorMsg:     '',
  toasts:           {},
}

export const EditPlaces = {
  title:  'title',
  inTask: (task) => `inTask${task.id}`,
}

/**
 * @typedef {Object} ToastActionPayload
 * @property {('info' | 'error')} type
 * @property {string} text
 * @property {(boolean | number)} autoHide
 */

/**
 * @typedef {Object} ActionsShape
 * @property {() => ({})} cancelEdit
 * @property {() => ({})} startTitleEdit
 * @property {(titleText: string) => ({})} saveTitleEdit
 * @property {(todoText: string) => ({todoText: string})} addTask
 * @property {(task: Task, taskIndex: number) => ({task: Task, taskIndex: number})} switchTaskDone
 * @property {(task: Task, taskIndex: number) => ({task: Task, taskIndex: number})} openTaskOpts
 * @property {() => ({})} closeTaskOpts
 * @property {(task: Task, taskIndex: number) => ({task: Task, taskIndex: number})} startTaskEdit
 * @property {(todoText: string) => ({todoText: string})} saveTaskEdit
 * @property {(isDirty: boolean) => ({isDirty: boolean})} memoDirtyEdit
 * @property {(task: Task, taskIndex: number) => ({})} deleteTask
 * @property {({ type: string, text: string, autoHide: boolean }) => ToastActionPayload} showToast
 * @property {() => ({})} hideToast
 */

const actionOnTask = (task, taskIndex) => ({ task, taskIndex })

/**
 * @type {ActionsShape}
 */
export const TodoActions = {
  cancelEdit:     () => ({}),
  startTitleEdit: () => ({}),
  saveTitleEdit:  (titleText) => ({ titleText }),
  // task actions
  addTask:        (todoText) => ({ todoText }),
  switchTaskDone: actionOnTask,
  openTaskOpts:   actionOnTask,
  closeTaskOpts:  () => ({}),
  startTaskEdit:  actionOnTask,
  saveTaskEdit:   (todoText) => ({ todoText }),
  memoDirtyEdit:  (isDirty) => ({ isDirty }),
  deleteTask:     actionOnTask,
  // toasts actions
  showToast:      ({ type = 'info', text, autoHide = true }) => ({ type, text, autoHide }),
  hideToast:      () => ({}),
}

const {
  fromProps, actions, untilAction, onActionFork, fromState, setState,
} = applyIoPhasesShapes({
  propsShape:   TodoPropTypes,
  stateShape:   TodoInitialState,
  actionsShape: TodoActions,
})

/**
 * @template ActionKey
 * @typedef {import('@claritale/react-fx-hook/dist/Types').ActionPayload<ActionsShape, ActionKey>} ActionPayload
 */

export function* TodoLogic() {
  yield* onActionFork('showToast', displayToast)

  yield* fork(todoAdditionLogic)
  yield* fork(todoDeletionLogic)
  yield* fork(todoSwitchDoneLogic)
  yield* fork(todosCompletedMessageLogic)
  yield* fork(todoOptionsLogic)
  yield* fork(todoEditingLogic)

  console.log('todos logic running!')
}

/**
 * @param {ActionPayload<'showToast'>} actionData
 */
function* displayToast({ type, text, autoHide }) {
  const id = getToastTodoId()

  yield* setState((s) => ({
    toasts: {
      ...s.toasts,
      [id]: {
        visible:  true,
        type,
        text,
        autoHide: !!autoHide,
      },
    },
  }))

  if (autoHide) {
    // eslint-disable-next-line no-nested-ternary
    const time = Number.isInteger(autoHide) ? autoHide : (type === 'error' ? 10000 : 3000)
    yield* race({
      timeout: delay(time),
      anyKey:  untilAction('ANY'),
    })
  } else {
    yield* untilAction('hideToast')
  }

  yield* setState((s) => {
    const { [id]: hiding, ...rest } = s.toasts
    hiding.visible = false
    return {
      toasts: {
        ...rest,
        [id]: hiding,
      },
    }
  })

  yield* delay(1000)

  yield* setState((s) => {
    const { [id]: deleting, ...rest } = s.toasts
    return {
      toasts: rest,
    }
  })
}

function* saveTasks(tasksUpdater) {
  const currTasks = yield* fromProps.getByKey('tasks')
  const newTaskState = tasksUpdater(currTasks)
  yield* fromProps.call(
    (p) => p.saveTasks(newTaskState),
  )
}

function* validateAddingTask(text) {
  const addErrorMsg = yield* fromState.getByKey('addErrorMsg')

  if (addErrorMsg) {
    yield* setState({ addErrorMsg: '' })
    yield* delay(200)
  }

  if (!text) {
    yield* setState({ addErrorMsg: 'task title required' })
    return false
  }

  const tasks = yield* fromProps.getByKey('tasks')

  if (tasks.some((x) => x.text === text)) {
    yield* setState({ addErrorMsg: 'can not duplicate titles' })
    return false
  }

  if (addErrorMsg) {
    yield* setState({ addErrorMsg: '' })
  }

  return !!text
}

function* todoAdditionLogic() {
  const addingTask = (newId, text, tasks) => [
    ...tasks,
    {
      id: newId, text, done: false, locked: false,
    },
  ]

  while (true) {
    const { todoText } = yield* untilAction('addTask')

    const valid = yield* validateAddingTask(todoText)

    if (valid) {
      const newId = yield* fromProps.call((p) => p.getUniqueId())
      yield* saveTasks(
        (currTasks) => addingTask(newId, todoText, currTasks),
      )
    }
  }
}

class LogicError extends Error {}

function* todoDeletionLogic() {
  const deletingTask = (idx, tasks) => [
    ...tasks.slice(0, idx),
    ...tasks.slice(idx + 1),
  ]

  while (true) {
    try {
      const { task, taskIndex } = yield* untilAction('deleteTask')

      if (task.locked) {
        throw new LogicError('The selected task is locked.')
      }

      // eslint-disable-next-line no-restricted-globals
      if (confirm('sure to delete?')) { // eslint-disable-line no-alert
        yield* saveTasks(
          (currTasks) => deletingTask(taskIndex, currTasks),
        )
      }
    } catch (e) {
      if (e.constructor !== LogicError) throw e
      yield* actions.showToast({ type: 'error', text: e.message, autoHide: false })
    }
  }
}

function* todoSwitchDoneLogic() {
  const switchingDoneAtIndex = (idx, tasks) => {
    const task = tasks[idx]
    return [
      ...tasks.slice(0, idx),
      { ...task, done: !task.done },
      ...tasks.slice(idx + 1),
    ]
  }

  while (true) {
    try {
      const { task, taskIndex } = yield* untilAction('switchTaskDone')

      const editActive = yield* fromState.select((s) => !!s.editingPlace)
      // debugger
      if (editActive) {
        continue
      }

      if (task.locked) {
        throw new LogicError('The selected task is locked.')
      }

      yield* saveTasks(
        (currTasks) => switchingDoneAtIndex(taskIndex, currTasks),
      )
    } catch (e) {
      if (e.constructor !== LogicError) throw e
      yield* actions.showToast({ type: 'error', text: e.message, autoHide: false })
    }
  }
}

function* todosCompletedMessageLogic() {
  while (true) {
    const isAllDone = yield* fromProps.onChange((p) => p.tasks.every((x) => x.done))

    if (isAllDone) {
      yield* actions.showToast({ text: "Congrats! All tasks done..." })

      yield* untilAction(['switchTaskDone', 'addTask'])
    }
  }
}

function* todoOptionsLogic() {
  while (true) {
    const action = yield* untilAction(['openTaskOpts', 'closeTaskOpts'])
    // debugger
    if (action.actionKey === 'openTaskOpts') {
      yield* setState({ openedOptsTodoId: action.task.id })
    } else {
      yield* setState({ openedOptsTodoId: 0 })
    }
  }
}

class TaskEditModel {
  atIndex = -1;

  isDirty = false;

  * start(inTask, atIndex) {
    if (this.atIndex >= 0) return
    this.atIndex = atIndex
    yield* setState({ editingPlace: EditPlaces.inTask(inTask) })
  }

  * finish({ savingText = false } = {}) {
    try {
      if (this.atIndex < 0 || !this.isDirty) return
      if (savingText !== false) {
        yield* saveTasks((currTasks) => this.editinText(savingText, currTasks))
      }
    } finally {
      yield* setState({ editingPlace: '' })
      this.atIndex = -1
      this.isDirty = false
    }
  }

  editinText(text, tasks) {
    const task = tasks[this.atIndex]
    return [
      ...tasks.slice(0, this.atIndex),
      { ...task, text },
      ...tasks.slice(this.atIndex + 1),
    ]
  }
}

function* todoEditingLogic() {
  // init edit model
  const edit = new TaskEditModel()

  while (true) {
    const action = yield* untilAction(['startTaskEdit', 'memoDirtyEdit', 'saveTaskEdit', 'cancelEdit'])

    switch (action.actionKey) {
      case 'startTaskEdit': {
        yield* edit.start(action.task, action.taskIndex)
        break
      }

      case 'memoDirtyEdit': {
        edit.isDirty = action.isDirty
        break
      }

      case 'saveTaskEdit': {
        yield* edit.finish({ savingText: action.todoText })
        break
      }

      default: {
        // eslint-disable-next-line no-restricted-globals
        if (edit.isDirty === false || confirm('you are dirty. discard?')) { // eslint-disable-line no-alert
          yield* edit.finish()
        }
        break
      }
    }
  }
}
