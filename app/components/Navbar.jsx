/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'

import Brand from './Brand'
import ConnectionState from './ConnectionState'

const STYLE = {
  color: 'black'
}

export default class Navbar extends Component<*> {
  render () {
    return (
      <nav className='navbar navbar-expand-lg navbar-light bg-light'>
        <Brand />
        <div className='collapse navbar-collapse' id='navbarText'>
          <a className='nav-link' href='/#/rover' style={STYLE}>Rover</a>
          { false && <span className='nav-link' href='/#/wallet' style={STYLE}>Wallet</span> }
        </div>
        <ConnectionState connected={this.props.connected} />
      </nav>
    )
  }
}
