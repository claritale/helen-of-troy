/**
 * @template P
 * @typedef {import('prop-types').InferProps<P>} InferingPropsTypes
 */

/* eslint-disable no-console */
import React from 'react'
import { useLogic } from '@claritale/react-fx-hook'

import Headers from '../Header'
import MyOffersSellingDialog from '../MyOffersSellingDialog'

import {
  AppLogic, AppPropTypes, AppInitialState, AppActions,
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
}

/**
 * @param {InferingPropsTypes<typeof AppPropTypes>} props
 */
export default function SellAppWidget(props) {
  const [state, actions] = useLogic(logicSetup, props)

  const { info, error } = state // AppInitialStateExample

  return (
    <div className="App">
      <Headers title="Offers Selling App Widget" onClose={props.onClose} />

      <MyOffersSellingDialog
        info={info}
        error={error}
        onSelect={(opt) => actions.select(opt)}
      />
    </div>
  )
}

SellAppWidget.propTypes = AppPropTypes
