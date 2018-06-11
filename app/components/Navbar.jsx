/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'
import { Nav, NavItem, Dropdown, DropdownItem, DropdownToggle, DropdownMenu, NavLink } from 'reactstrap'

import Brand from './Brand'
import ConnectionState from './ConnectionState'

const STYLE = {
 color: 'black'
}

type State = {
  dropdownOpen: bool
}

export class Navbar extends Component<*, State> {
  state: Object // eslint-disable-line no-undef

  constructor (props: any) {
    super(props)

    this.state = {
      dropdownOpen: false
    }
  }

  render () {
    return (
      <Nav className='navbar navbar-expand-sm navbar-light bg-light' style={{borderLeft: 0, borderRight: 0}}>
        <Brand>
          <ConnectionState style={{marginLeft: '10px'}} connected={this.props.connected} type='dot' />
        </Brand>

        <NavItem>
          <NavLink href='/#/blocks/latest' style={STYLE}>Multichain</NavLink>
        </NavItem>

        <NavItem>
          <NavLink href='/#/miner' style={STYLE}>Miner</NavLink>
        </NavItem>

        <NavItem>
          <NavLink href='/#/rover' style={STYLE}>Rover</NavLink>
        </NavItem>

        <NavItem>
          <NavLink href='/#/peers' style={STYLE}>Peers</NavLink>
        </NavItem>

        <Dropdown nav isOpen={this.state.dropdownOpen} toggle={
          () => {
            this.setState({
              dropdownOpen: !this.state.dropdownOpen
            })
          }
        } >
          <DropdownToggle nav caret style={STYLE}>
            Dev
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem href='https://www.blockcollider.org'>Homepage</DropdownItem>
            <DropdownItem href='/#/doc'>Documentation</DropdownItem>
            <DropdownItem href='/#/logs'>Logs</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </Nav>
    )
  }
}

export default Navbar
