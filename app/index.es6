/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { render } from './components/Root'
import { createHistory, createStore } from './store'
import Raven from 'raven-js'

import { init as initAppReducer } from './reducers/app/reducer'
import { init as initSocketReducer } from './reducers/socket/reducer'

declare var SENTRY_DSN: string
declare var SENTRY_ENABLED: boolean

// Create history
const history = createHistory()

// Create store
const store = createStore(history)

// Initialize internal app reducer
initAppReducer(store.dispatch)

// Initialize socket
initSocketReducer(store.dispatch)

// Initialize raven/sentry
if (SENTRY_ENABLED) {
  Raven.config(SENTRY_DSN).install()
  Raven.context(() => {
    // Render topmost component
    render('app', history, store)
  })
} else {
  // Render topmost component
  render('app', history, store)
}
