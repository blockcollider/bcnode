/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import React, { Component } from 'react'

export default class ConnectionState extends Component<*> {
  render () {
    const statusClass = this.props.connected ? 'badge-success' : 'badge-warning'

    return (
      <span className={`badge ${statusClass}`}>{this.props.connected ? 'CONNECTED' : 'DICONNECTED'}</span>
    )
  }
}
