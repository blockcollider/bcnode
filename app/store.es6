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
import createSagaMiddleware from 'redux-saga'

import { reducer as appReducer } from './reducers/app/reducer'
import { reducer as blockReducer } from './reducers/block/reducer'
import { reducer as blocksReducer } from './reducers/blocks/reducer'
import { reducer as minerReducer } from './reducers/miner/reducer'
import { reducer as peerReducer } from './reducers/peer/reducer'
import { reducer as peersReducer } from './reducers/peers/reducer'
import { reducer as profileReducer } from './reducers/profile/reducer'
import { reducer as roverReducer } from './reducers/rover/reducer'
import { reducer as socketReducer } from './reducers/socket/reducer'

export const createHistory = () => {
  return createReduxHistory()
}

// create the saga middleware
const sagaMiddleware = createSagaMiddleware()

// Add the reducer to your store on the `router` key
// Also apply our middleware for navigating
export const createStore = (history: Object, reducers: Object = {}) => {
  const store = createReduxStore(
    combineReducers({
      app: appReducer,
      block: blockReducer,
      blocks: blocksReducer,
      miner: minerReducer,
      peer: peerReducer,
      peers: peersReducer,
      profile: profileReducer,
      router: routerReducer,
      rover: roverReducer,
      socket: socketReducer,
      ...reducers
    }),
    composeWithDevTools(applyMiddleware(
      routerMiddleware(history),
      sagaMiddleware
    ))
  )

  // store.subscribe(() =>
  //   console.log('createReduxStore() - state', store.getState())
  // )

  return store
}
