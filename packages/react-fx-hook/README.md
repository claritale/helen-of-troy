# @claritale/react-fx-hook

> Just another React custom Hook for managing components Logic/Effects

<br />

[Try this demo!](https://react-fx-hook.vercel.app)

<br />

This library was generated with [Nx](https://nx.dev).

<br />

[![NPM](https://img.shields.io/npm/v/@claritale/react-fx-hook.svg)](https://www.npmjs.com/package/@claritale/react-fx-hook) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

<br />

## Install

```bash
npm install --save @claritale/react-fx-hook
```

<br />

## Usage

> Once upon a ....well, just try to follow the Tale :)
```jsx
import React from 'react'

// @here, Import the Hook and Phases to drive your widget
// (I prefer to put my logic/effects in a separate file, as I do with styles)
import { useLogic, logicPhases } from '@claritale/react-fx-hook'

// This will be a pure presentational component
import MyOffersSellingDialog from './MyOffersSellingDialog'


const logicSetup = {
  mainLogicGen: AppLogic,
  initialState: InitialState,
  actionsMap: ActionsMap,
}

const MyAppSellWidget = (props) => {

  const [state, actions] = useLogic(logicSetup, props);

  const { info, error } = state;

  return (
    <div className={'App'}>
      <h1>Offers Selling App Widget</h1>

      <MyOffersSellingDialog
        info={info}
        error={error}
        onSelect={(opt) => actions.select(opt)}      
      />
    </div> 
  )
}

MyAppSellWidget.propTypes = {
  complete: PropType.func.required
}


// -------------------------------

/**
 * Now, let's setup state initial values and the expected actions map
 * 
 * (to really have fully working type-checking, these declarations
 *  should be either in typescript, flow, or jsDoc annotations)
*/
const InitialState = {
  info: { step: '', title: '', subtitle: '', opts: [] },
  error: '',
}
const ActionsMap = {
  select: (option) => ({ option }),
}


// Pick the needed phases to code your widget logic/effects
const {
  applyIoPhasesShapes,
  delay,
} = logicPhases

// Init bindings of i/o phases with their respective shapes
// (this is indeed the step that enables type-checking of running results of used phases)
const { untilAction, setState, fromProps } = applyIoPhasesShapes({ 
  stateShape: InitialState, 
  actionsShape: ActionsMap 
})


/**
 * Now just express your component logic ..sequentially like when using async/await, 
 * but here, using es6 generators (at a lower level, but like Redux-Saga !)
*/

  const offersStack = {
    1: { 
      code: 'TRIP',
      caption: 'Offer #1 - Vacations ..',
      details: "You can't wait to breathe ..",
      taken: false,
    },
    2: { 
      code: 'SPA',
      caption: 'Offer #2 - Spa time! ..',
      details: "Why not ..",
      taken: false,
    }
  }

function* AppLogic() {
  
  // on landing, start by greeting for a moment..
  yield* setState({ 
    info: { 
      step: 'Intro', 
      title: 'Welcome to my App :>',
    } 
  })
  yield* delay(3000)

  // And start the selling show
  while (true) {
    const optionsMap = {
      1: { 
        opt: 1, 
        disabled: offersStack[1].taken,
        caption: offersStack[1].caption + ' See more',
      },
      2: { 
        opt: 2, 
        disabled: offersStack[2].taken,
        caption: offersStack[2].caption + ' See more',
      },
    }

    // ..Display available offers
    yield* setState({ 
      info: { 
        step: 'Offers of the Day', 
        title: 'Here you have only the Best !',
        opts: Object.values(optionsMap)
      } 
    })

    // then let your user make her choise
    const { option: offerId } = yield* untilAction('select')

    const offer = offersStack[offerId]

    // let her know more..
    yield* setState({ 
      info: { 
        step: 'Offer Details', 
        title: offer.caption,
        subtitle: offer.details,
        opts: [
          { opt: 1, caption: 'I want this offer!' },
          { opt: 2, caption: 'Back to list' },
        ]
      } 
    })

    while (true) {

      // ..once again, the user .. 
      // (same action / dif effect)
      const { option } = yield* untilAction('select')
  
      if (option === 1) { // it's like, she want it
  
          if (offer.code === 'SPA') {
              // ..bad luck ?? :/
              yield* flashError('Upss sorry, something went wrong booking ..')

              if (offersStack[1].taken) {
                // Then, here ends the flow 
                yield* flashError('It seems our service is down. \n Please, try again later')
                yield* fromProps.call((p) => p.complete())
                return
              }

          } else {
              // no the SPA,
              // good choise ;)
              yield* booking(offer)

              offer.taken = true

              yield* setState({ 
                info: { 
                  step: 'Completing', 
                  title: 'Nice !!',
                  subtitle: 'Wanna keep looking ?',
                  opts: [
                    { opt: 1, caption: 'That will be all' },
                    { opt: 2, caption: 'Back to list' },
                  ]
                } 
              })
              const { option } = yield* untilAction('select')
              if (option === 1) {
                yield* fromProps.call((p) => p.complete())
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

function* booking(offer) {
    // could imply an Api call .. ">
    yield* setState({ 
      info: { 
        step: 'Booking ..', 
        title: 'Booking your awsome choise ! \n ' + offer.caption,
        subtitle: '..just a second.',
        opts: [],
      } 
    })

    // tick tack
    yield* delay(3000)

    // confirm her place in that Vacation ...oopss, Busted :p
    yield* setState({ 
      info: { 
        step: 'confim', 
        title: "Good News, you've just locked this offer"
        subtitle: '>> the ' + offer.caption,
        opts: [
          { opt: 1, caption: "Okeeey" }
        ]
      } 
    })
    yield* untilAction('select')
}

function* flashError(message) {
    // display the important message
    yield* setState({ error: message })
    // let it be
    yield* delay(3000)
    // and take it out
    yield* setState({ error: '' })
}

```

<br />

> .. was it easy to follow the widget's subtle intentions ?

<br />

### if so, we the people, at <b><i>ClariTale</i></b>, are pleased. Thanks for your visit !


">

<br />

## Running unit tests

Run this to execute the unit tests via [Jest](https://jestjs.io).

```bash
nx test react-fx-hook
```

<br />

## License

MIT © [](https://github.com/)