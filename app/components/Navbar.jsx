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

export class Navbar extends Component<*> {
  render () {
    // const renderDropdown = () => (
    //   <li className='nav-item dropdown'>
    //     <a className='nav-link dropdown-toggle' id='navbarDropdownMenuLink' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
    //       Dropdown Link
    //     </a>
    //     <div className='dropdown-menu' aria-labelledby='navbarDropdownMenuLink'>
    //       <a className='dropdown-item' href='#'>Action</a>
    //     </div>
    //   </li>
    // )

    return (
      <nav className='navbar navbar-expand-sm navbar-light bg-light' style={{borderLeft: 0, borderRight: 0}}>
        <Brand>
          <ConnectionState style={{marginLeft: '10px'}} connected={this.props.connected} type='dot' />
        </Brand>

        <div className='collapse navbar-collapse' id='navbarNavDropdown'>
          <ul className='navbar-nav'>
            { false && <li className='nav-item'>
              <a className='nav-item nav-link' href='/#/profile' style={STYLE}>
                <i className='fas fa-user' /> Profile
              </a>
            </li> }

            <li className='nav-item'>
              <a className='nav-link' href='/#/blocks/latest' style={STYLE}>BC Chain</a>
            </li>

            <li className='nav-item'>
              <a className='nav-link' href='/#/miner' style={STYLE}>Miner</a>
            </li>

            <li className='nav-item'>
              <a className='nav-link' href='/#/rover' style={STYLE}>Rover</a>
            </li>

            <li className='nav-item'>
              <a className='nav-link' href='/#/peers' style={STYLE}>Peers</a>
            </li>

            <li className='nav-item'>
              <a className='nav-link' href='/#/logs' style={STYLE}>Logs</a>
            </li>
          </ul>
        </div>
      </nav>
    )
  }
}

export default Navbar
