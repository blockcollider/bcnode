/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import React, { Component } from 'react'

import ConnectionState from './ConnectionState'

export default class Navbar extends Component<*> {
  render () {
    const styleBrand = {
      height: '35px',
      width: '35px',
      padding: 0
    }

    return (
      <nav className='navbar nnavbar-expand-lg navbar-light bg-light'>
        <a className='navbar-brand' href='https://blockcollider.org'>
          <img src='/img/bc-black.png' style={styleBrand} />
          <span style={{marginLeft: '10px'}}>Block Collider</span>
        </a>
        <div className='collapse navbar-collapse' id='navbarText'>
          <a className='nav-link' href='/'>Blocks</a>
        </div>
        <ConnectionState connected={this.props.connected} />
      </nav>
    )
  }
}
