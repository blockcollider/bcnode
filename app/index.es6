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
import { initSocket } from './socket'

// Create history
const history = createHistory()

// Create store
const store = createStore(history)

// Initialize socket
initSocket(store.dispatch)

// Render topmost component
render('app', history, store)
