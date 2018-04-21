/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import createReduxHistory from 'history/createHashHistory'
import { routerMiddleware, routerReducer } from 'react-router-redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import { applyMiddleware, combineReducers, createStore as createReduxStore } from 'redux'

import { reducer as roverReducer } from './components/Rover'
import { reducer as socketReducer } from './socket'

export const createHistory = () => {
  return createReduxHistory()
}

// Add the reducer to your store on the `router` key
// Also apply our middleware for navigating
export const createStore = (history: Object, reducers: Object = {}) => {
  const store = createReduxStore(
    combineReducers({
      router: routerReducer,
      rover: roverReducer,
      socket: socketReducer,
      ...reducers
    }),
    composeWithDevTools(applyMiddleware(routerMiddleware(history)))
  )

  // store.subscribe(() =>
  //   console.log('createReduxStore() - state', store.getState())
  // )

  return store
}
