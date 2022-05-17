import React, { useState } from 'react'
import { useLogic } from '@claritale/react-fx-hook'

import Header from '../Header'
import DemoButton from '../DemoButton'
import TodoAppWidget from '../TodoAppWidget'
import SellAppWidget from '../SellAppWidget'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.css';
import NxDemoStyles from './nx-demo-styles';

import {
  AppLogic, AppInitialState, AppActions,
} from './app-logic'

const logicSetup = {
  mainLogicGen: AppLogic,
  initialState: AppInitialState,
  actionsMap:   AppActions,
  // enableLogs:   true,
}

const AppWidgetNames = {
  TodoAppWidget: 'TodoAppWidget',
  SellAppWidget: 'SellAppWidget',
}

const AppWidgets = {
  [AppWidgetNames.SellAppWidget]: SellAppWidget,
  [AppWidgetNames.TodoAppWidget]: TodoAppWidget,
}

const RESET_COUNT_DOWN = 5

export function App() {
  const [state, actions] = useLogic(logicSetup, {})


  const { runningSeconds, secsBeforeReset } = state

  const [activeAppWidgetName, setActiveAppWidgetName] = useState('')

  const handleClose = () => setActiveAppWidgetName('')

  const renderActiveAppWidget = () => {
    const AppWidgetClass = AppWidgets[activeAppWidgetName]
    return AppWidgetClass
      ? (
          <AppWidgetClass onClose={handleClose} />
      ) : (
        <Header title={`${activeAppWidgetName} - Comming Soon`} onClose={handleClose} />
      )
  }


  return (
    <>
      <NxDemoStyles />

      <div className="wrapper">
        <div className="container">
          {!activeAppWidgetName
            ? (
              <>
                <div id="welcome" className="rounded shadow">
                  <h1>
                    <span> Hello there ! </span>
                    Welcome to @clariTale/react-fx-hook Demo &nbsp; 👋
                  </h1>
                </div>

                <div id="middle-content" className="rounded shadow">
                  <div id="running-counter">
                    <h3>Example Apps</h3>
                    <h4>{`[running for: ${runningSeconds} secs]`}</h4>

                    <button
                      type="button"
                      className='header-btn'
                      onClick={() => actions.resetRunningSecs(RESET_COUNT_DOWN)}
                    >
                      {`Reset counter (in ${RESET_COUNT_DOWN}s)`}
                    </button>
                    {!!secsBeforeReset && <h5>{`[T before reset: ${secsBeforeReset} secs]`}</h5>}
                  </div>

                  <div>
                    <DemoButton
                      title='Sell Offers Widget Example'
                      subTitle='Wizard kind of demo'
                      onClick={() => setActiveAppWidgetName(AppWidgetNames.SellAppWidget)}
                    />

                    <DemoButton
                      title='Todos App Widget Example'
                      subTitle='Another Todo demo'
                      onClick={() => setActiveAppWidgetName(AppWidgetNames.TodoAppWidget)}
                    />
                  </div>
                </div>
              </>
            )
            : (
              <div id="app-content" className="rounded shadow">
                {renderActiveAppWidget()}
              </div>
            )
          }
        </div>
      </div>
    </>
  );
}

export default App;
