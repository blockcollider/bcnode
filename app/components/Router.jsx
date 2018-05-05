/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'
import { ConnectedRouter } from 'react-router-redux'
import { Redirect, Route } from 'react-router'

import { App } from './App'

import {
  Block,
  Blocks,
  Miner,
  Peer,
  Peers,
  Rover
} from '../containers/index'

export class Router extends Component<*> {
  render () {
    return (
      <ConnectedRouter history={this.props.history} >
        <App>
          <Route exact path='/' component={() => {
            return (<Redirect to='/rover' />)
          }} />
          <Route path='/block/:id/' component={Block} />
          <Route path='/blocks/:id/' component={Blocks} />
          <Route path='/miner' component={Miner} />
          <Route path='/rover' component={Rover} />
          <Route path='/peer/:id/' component={Peer} />
          <Route path='/peers' component={Peers} />
        </App>
      </ConnectedRouter>
    )
  }
}
