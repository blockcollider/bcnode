/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import { Provider } from 'react-redux'

import { Router } from './Router'

export class Root extends Component<*> {
  render () {
    const {history, store} = this.props
    return (
      <Provider store={store}>
        <Router history={history} />
      </Provider>
    )
  }
}

export const render = (id: string, history: Object, store: Object) => {
  const appEl = document.getElementById(id)
  if (appEl) {
    ReactDOM.render((
      <Root history={history} store={store} />
    ), appEl)
  } else {
    console.error('Cannot find element with id "app"')
  }
}

export default Root
