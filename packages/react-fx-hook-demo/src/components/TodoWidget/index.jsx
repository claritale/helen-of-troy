/**
 * @template P
 * @typedef {import('prop-types').InferProps<P>} InferingPropsTypes
 */
/* eslint-disable no-console */
import React from 'react'
import { useLogic } from '@claritale/react-fx-hook'

import Header from '../Header'
import TextEditor from './TextEditor'
import Checkbox from './Checkbox'

import {
  TodoLogic, TodoPropTypes, TodoInitialState, TodoActions, EditPlaces,
} from './todos-logic'

// import "./styles.css";

const TodosLogicFinished = ({ cancelled, error }) => {
  if (cancelled) console.warn('Todos run Logic cancelled', cancelled)
  if (error) console.error('Todos run Logic error', error)
  if (!cancelled && !error) console.info('Todos run Logic finished ok!')
}

const logicSetup = {
  mainLogicGen: TodoLogic,
  initialState: TodoInitialState,
  actionsMap:   TodoActions,
  onFinish:     TodosLogicFinished,
  enableLogs:   true,
}

/**
 * @param {InferingPropsTypes<typeof TodoPropTypes>} props
 */
export default function TodoWidget(props) {
  // eslint-disable-next-line react/prop-types
  const { title, tasks, onClose } = props

  const [state, actions] = useLogic(logicSetup, props)

  const {
    editingTitle,
    addErrorMsg,
    openedOptsTodoId,
    editingPlace,
    editErrorMsg,
    toasts,
  } = state

  return (
    <div
      style={{
        borderRadius: 10,
        padding:      12,
        margin:       20,
        background:   'azure',
        width:        500,
      }}
      // id="todo-card"
      // onClick={(ev) => {
      //   // if (['BUTTON', 'INPUT'].includes(ev.target.nodeName)) return
      //   // console.log('$$$$ ev', {...ev})
      //   // debugger
      //   // if (ev.target.id === 'todo-card') {
      //   //   actions.cancelEdit()
      //   // }
      // }}
    >

      {editingTitle === false
        ? (
          <Header
            title={title}
            TitleComponent="h2"
            onTitleClick={actions.startTitleEdit}
            onClose={onClose}
          />
        ) : (
          <TextEditor
            initialText={title}
            doneLabel="save"
            onDone={actions.saveTitleEdit}
            onCancel={actions.cancelEdit}
            error={editErrorMsg}
            inputStyle={{ width: 300, margin: 20 }}
          />
        )}

      <TextEditor
        placeholder="New Task title"
        doneLabel="add"
        onDone={actions.addTask}
        error={addErrorMsg}
        inputStyle={{ width: 300 }}
        disabled={!!editingPlace}
      />

      <h3
        style={{
          marginLeft: '20%',
          textAlign:  'left',
        }}
      >
        Tasks list
      </h3>

      <div
        style={{
          display:       'flex',
          flexDirection: 'column',
          width:         '75%',
          marginLeft:    '20%',
        }}
      >
        {tasks.map((task, idx) => {
          const optionsShown = openedOptsTodoId === task.id
          const editingHere = editingPlace === EditPlaces.inTask(task)
          const editingOther = !!editingPlace && !editingHere
          return (
            <div
              key={task.id}
              style={{
                display:    'flex',
                alignItems: 'center',
                // background: 'yellow',
                height:     25,
              }}
            >
              <div
                style={{
                  flexGrow:  1,
                  display:   'flex',
                  // background: 'lime',
                  textAlign: 'left',
                }}
              >
                {editingHere === false
                  ? (
                    <>
                      <Checkbox
                        id={task.id}
                        label={task.text}
                        isSelected={task.done}
                        onCheckboxChange={() => actions.switchTaskDone(task, idx)}
                        maxWidth={task.locked ? 175 : 235}
                        disabled={editingOther}
                      />
                      {task.locked && (
                      <span style={{ marginLeft: 8, color: 'red', fontStyle: 'italic' }}>(locked)</span>
                      )}
                    </>
                  ) : (
                    <TextEditor
                      initialText={task.text}
                      doneLabel="save"
                      cancelLabel="cancel"
                      onDone={actions.saveTaskEdit}
                      onCancel={actions.cancelEdit}
                      onDirty={actions.memoDirtyEdit}
                      error={editErrorMsg}
                      doneOnlyIfDirty
                      inputStyle={{ width: 237 }}
                    />
                  )}
              </div>

              {!editingHere && (
                <div
                  style={{
                    marginLeft: 8,
                    width:      125,
                    textAlign:  'left',
                    flexShrink: 0,
                  }}
                >
                  {optionsShown && (
                    <>
                      <button style={{ marginLeft: 8 }} type="button" onClick={() => actions.startTaskEdit(task, idx)}>
                        edit
                      </button>
                      <button style={{ marginLeft: 8 }} type="button" onClick={() => actions.deleteTask(task, idx)}>
                        del
                      </button>
                    </>
                  )}

                  <button
                    style={{ marginLeft: 8 }}
                    type="button"
                    disabled={editingOther}
                    onClick={() => {
                      if (optionsShown) {
                        actions.closeTaskOpts()
                      } else {
                        actions.openTaskOpts(task, idx)
                      }
                    }}
                  >
                    {optionsShown ? '<' : '>'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {Object.entries(toasts).map(([toastId, toast]) => (
        <div
          key={toastId}
          style={{
            display:        'flex',
            justifyContent: 'center',
            alignItems:     'center',
          }}
        >
          <Header
            title={toast.text}
            TitleComponent="h2"
            titleStyle={{ color: toast.type === 'error' ? 'red' : 'blue' }}
            onClose={!toast.autoHide && (() => actions.hideToast())}
          />

          {!toast.visible && <span style={{ marginLeft: 8 }}>..gonna hide!</span>}
        </div>
      ))}

      {/* <pre>{JSON.stringify({ openedOptsTodoId, editingTodoId })}</pre> */}
    </div>
  )
}

TodoWidget.propTypes = TodoPropTypes
