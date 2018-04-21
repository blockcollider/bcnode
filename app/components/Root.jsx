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
import { ConnectedRouter } from 'react-router-redux'
import { Redirect, Route } from 'react-router'

import App from './App'
import Rover from './Rover'

export default class Root extends Component<*> {
  render () {
    const {history, store} = this.props
    return (
      <Provider store={store}>
        <ConnectedRouter history={history} >
          <App>
            <Route exact path='/' component={() => {
              return (<Redirect to='/rover' />)
            }} />
            <Route path='/rover' component={Rover} />
          </App>
        </ConnectedRouter>
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
