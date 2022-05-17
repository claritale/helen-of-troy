/* eslint-disable no-console */
import PropTypes from 'prop-types'
import { logicPhases } from '@claritale/react-fx-hook'

const {
  applyIoPhasesShapes,
  delay,
} = logicPhases

/**
 * Now, let's setup state initial values and the expected actions map
 *
 * (to really have fully working type-checking, these declarations
 *  should be either in typescript, flow, or jsDoc annotations)
*/

export const AppPropTypes = {
  onClose: PropTypes.func.isRequired,
}

/**
 * @typedef {Object} Option
 * @property {number} opt
 * @property {boolean} [disabled=false]
 * @property {string} caption
 *
 * @typedef {Object} Info
 * @property {string} step
 * @property {string} title
 * @property {string} [subtitle]
 * @property {Option[]} opts
 *
 * @typedef {Object} StateShape
 * @property {Info} info
 * @property {string} error
 */

/**
 * @type {StateShape}
 */
export const AppInitialState = {
  info:  { step: '', title: '', opts: [] },
  error: '',
}

export const AppActions = {
  /**
   * @param {number} option
   */
  select: (option) => ({ option }),
}

// Init bindings of i/o phases with their respective shapes
// (this is step indeed that enables type-checking of running results of used phases)
const { fromProps, untilAction, setState } = applyIoPhasesShapes({
  propsShape:   AppPropTypes,
  stateShape:   AppInitialState,
  actionsShape: AppActions,
})

/**
 * Now just express your component logic ..sequentially like when using async/await,
 * but here, using es6 generators (at a lower level, but like Redux-Saga !)
*/

/**
 * @typedef {Object} Offer
 * @property {string} code
 * @property {string} caption
 * @property {string} details
 * @property {boolean} taken
 */

/**
 * @type {Object.<number, Offer>}
 */
const offersStack = {
  1: {
    code:    'TRIP',
    caption: 'Offer #1 - Vacations ..',
    details: "You can't wait to breathe ..",
    taken:   false,
  },
  2: {
    code:    'SPA',
    caption: 'Offer #2 - Spa time! ..',
    details: 'Why not ..',
    taken:   false,
  },
}

export function* AppLogic() {
  // on landing, start by greeting for a moment..
  yield* showIntro('Welcome to my App :>')

  // And start the selling show
  while (true) {
    /**
     * @type {Object.<number, Option>}
     */
    const optionsMap = {
      1: {
        opt:      1,
        disabled: offersStack[1].taken,
        caption:  `${offersStack[1].caption} See more`,
      },
      2: {
        opt:      2,
        disabled: offersStack[2].taken,
        caption:  `${offersStack[2].caption} See more`,
      },
    }

    // ..Display available offers
    yield* setState({
      info: {
        step:  'Offers of the Day',
        title: 'Here you have \n only the Best !',
        opts:  Object.values(optionsMap),
      },
    })

    // then let your user make her choise
    const { option: offerId } = yield* untilAction('select')

    const offer = offersStack[offerId]

    // let her know more..
    yield* setState({
      info: {
        step:     'Offer Details',
        title:    offer.caption,
        subtitle: offer.details,
        opts:     [
          { opt: 1, caption: 'I want this offer!' },
          { opt: 2, caption: 'Back to list' },
        ],
      },
    })

    while (true) {
      // ..once again, the user ..
      // (same action / dif effect)
      const { option } = yield* untilAction('select')

      if (option === 1) { // it's like, she want it
        if (offer.code === 'SPA') {
          // ..bad luck ?? :/
          yield* flashError("Upss sorry, something went wrong booking .. \n\n [ FYI ..it's all just kidding ]")

          if (offersStack[1].taken) {
            // Then, here ends the flow
            yield* flashError(
              'It seems our service is down. \n Please, try again later. \n\n [ FYI ..again, just kidding :b ]',
              false,
            )
            yield* fromProps.call((props) => props.onClose())
            return
          }
        } else {
          // no the SPA,
          // good choise ;)
          yield* booking(offer)

          offer.taken = true

          yield* setState({
            info: {
              step:     'Completing',
              title:    'Nice !!',
              subtitle: 'Wanna keep looking ?',
              opts:     [
                { opt: 1, caption: 'That will be all' },
                { opt: 2, caption: 'Back to list' },
              ],
            },
          })
          const { option: op } = yield* untilAction('select')
          if (op === 1) {
            const closer = yield* fromProps.call((props) => props.onClose)
            closer()
            return
          }
          break
        }
      } else {
        // didn't want it, ok, back to the list
        break
      }
    }
  }
}

/**
 * @param {string} greeting
 */
function* showIntro(greeting) {
  yield* setState({
    info: {
      step:  'Intro',
      title: greeting,
      opts:  [],
    },
  })

  yield* countDown(3)
}

/**
 * @param {Offer} offer
 */
function* booking(offer) {
  // could imply an Api call .. ">
  yield* setState({
    info: {
      step:     'Booking ..',
      title:    `Booking your awsome choise ! \n ${offer.caption}`,
      subtitle: '..just a second.',
      opts:     [],
    },
  })

  // tick tack
  yield* delay(1000)
  yield* countDown(5)

  // confirm her place in that Vacation ...upss, Busted :p
  yield* setState({
    info: {
      step:     'confim',
      title:    "Good News, you've just locked this offer",
      subtitle: `>> the ${offer.caption}`,
      opts:     [
        { opt: 1, caption: 'Okeeey' },
      ],
    },
  })
  yield* untilAction('select')
}

function* countDown(to) {
  for (let i = 1; i < to + 1; i += 1) {
    yield* setState((s) => ({
      info: {
        ...s.info,
        subtitle: '...',
      },
    }))

    yield* delay(100)

    yield* setState((s) => ({
      info: {
        ...s.info,
        subtitle: `..${i}`,
      },
    }))

    yield* delay(700)
  }
}

/**
 * @param {string} message
 */
function* flashError(message, autoHide = true) {
  // display the important message
  yield* setState({ error: message })
  // let it be
  yield* delay(2000)
  if (autoHide) {
    // and take it out
    yield* setState({ error: '' })
  }
}
