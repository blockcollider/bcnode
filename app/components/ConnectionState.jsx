/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Dot } from './Dot'

export class ConnectionState extends Component<*> {
  static defaultProps = {
    type: 'badge'
  }

  static propTypes = {
    type: PropTypes.oneOf(['dot', 'badge'])
  }

  render () {
    const connected = this.props.connected
    switch (this.props.type) {
      case 'dot':
        const color = connected ? 'green' : 'red'
        return (
          <Dot style={this.props.style} color={color} size={15} />
        )

      case 'badge':
        const statusClass = connected ? 'badge-success' : 'badge-warning'
        return (
          <span style={this.props.style} className={`badge ${statusClass}`}>{connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
        )
    }
  }
}

const component = connect(state => ({
  connected: state.socket.connected
}))(ConnectionState)

export default component
