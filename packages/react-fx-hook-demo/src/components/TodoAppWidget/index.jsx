/* eslint-disable react/prop-types */
/**
 * @template P
 * @typedef {import('prop-types').InferProps<P>} InferingPropsTypes
 */

/* eslint-disable no-console */
import React, { useState } from 'react'
import { useLogic } from '@claritale/react-fx-hook'

import Headers from '../Header'
import TodoWidget from '../TodoWidget'

import {
  AppLogic, AppInitialState, AppActions, getUniqueId,
} from './app-logic'

import './styles.css'

const AppLogicFinished = ({ cancelled, error }) => {
  if (cancelled) { console.log('App run Logic cancelled', cancelled) }
  if (error) { console.log('App run Logic error', error) }
  if (!cancelled && !error) { console.log('App run Logic finished ok!') }
}

const logicSetup = {
  mainLogicGen: AppLogic,
  initialState: AppInitialState,
  actionsMap:   AppActions,
  onFinish:     AppLogicFinished,
  enableLogs:   true,
}

/**
 * @param {InferingPropsTypes<typeof AppPropTypes>} props
 */
export default function TodoAppWidget(props) {
  const [newTodosTitle, setTodosTitle] = useState('')

  const [state, actions] = useLogic(logicSetup, props)

  const { savedTodosList, inputErrorMsg } = state

  return (
    <div
      className="App"
      style={{
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        alignItems:     'center',
      }}
    >
      <Headers title="Todo App Widget" onClose={props.onClose} />

      <div
        style={{
          display:      'flex',
          alignItems:   'start',
          marginBottom: 24,
        }}
      >
        <div>
          <input
            type="text"
            style={{ width: 300 }}
            value={newTodosTitle}
            onChange={({ target }) => setTodosTitle(target.value)}
          />
          {inputErrorMsg && <div style={{ color: 'red' }}>{inputErrorMsg}</div>}
        </div>

        <button style={{ marginLeft: 8 }} type="button" onClick={() => actions.newTodos(newTodosTitle)}>
          New Todos
        </button>
      </div>

      <hr style={{ width: '100%' }} />

      {savedTodosList.map((todos) => (
        <TodoWidget
          key={todos.id}
          title={todos.title}
          tasks={todos.tasks}
          saveTitle={(titleText) => actions.saveTitle(todos.id, titleText)}
          saveTasks={(tasks) => actions.saveTasks(todos.id, tasks)}
          saveError={todos.saveError}
          getUniqueId={getUniqueId}
          onClose={() => actions.closeTodos(todos.id)}
        />
      ))}
    </div>
  )
}
