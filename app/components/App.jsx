/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'
import { merge, concat } from 'ramda'

import Blocks from './Blocks'
import Navbar from './Navbar'

type State = {
  blocks: Object[],
  connected: bool
}

export default class App extends Component<*, State> {
  _socket: any

  constructor () {
    super()
    this.state = { blocks: [], connected: false }
  }

  componentDidMount () {
    this._run()
  }

  componentWillUnmount () {
    this._socket.close()
  }

  render () {
    let blocks = null
    if (this.state.connected) {
      blocks = <Blocks blocks={this.state.blocks} />
    } else {
      blocks = <div>Disconnected</div>
    }

    return (
      <div className='container-fluid'>
        <Navbar />
        <div className='container'>
          <h2>Collected blocks (last 20) <ConnectionState connected={this.state.connected} /></h2>
          {blocks}
        </div>
      </div>
    )
  }

  _run () {
    this._socket = new WebSocket(`ws://${location.hostname}:${location.port}/ws`) // eslint-disable-line
    this._socket.onopen = () => {
      this.setState(merge(this.state, { connected: true, blocks: [] }))
    }
    this._socket.onmessage = (data) => {
      // $FlowFixMe
      this.setState(merge(this.state, { blocks: concat(this.state.blocks, [JSON.parse(data.data)]) }))
    }
    this._socket.onclose = () => {
      this.setState(merge(this.state, { connected: false }))
      window.setTimeout(this._run.bind(this), 1000)
    }
  }
}

const ConnectionState = ({ connected }) => {
  const statusClass = connected ? 'badge-success' : 'badge-warning'

  return (
    <span className={`badge ${statusClass}`}>{connected ? 'CONNECTED' : 'DICONNECTED'}</span>
  )
}
