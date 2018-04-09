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
import { merge, concat, take } from 'ramda'

import Block from './Block.jsx'

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

  _run () {
    this._socket = new WebSocket(`ws://${location.hostname}:${location.port}/ws`) // eslint-disable-line
    this._socket.onopen = () => {
      this.setState(merge(this.state, { connected: true }))
    }
    this._socket.onmessage = (data) => {
      // $FlowFixMe
      this.setState(merge(this.state, { blocks: concat(this.state.blocks, [JSON.parse(data.data)]) }))
    }
    this._socket.onclose = () => {
      this.setState(merge(this.state, { connected: false, blocks: [] }))
      window.setTimeout(this._run.bind(this), 1000)
    }
  }

  componentDidMount () {
    this._run()
  }

  componentWillUnmount () {
    this._socket.close()
  }

  render () {
    const blocks = take(20, this.state.blocks.sort((a, b) => b.timestamp - a.timestamp)).map(block => {
      return <Block {...block} key={block.data.hash} />
    })
    return (
      <div className='container'>
        <h1>Blockcollider</h1>
        <div className='container'>
          <h2>Collected blocks (last 20) <ConnectionState connected={this.state.connected} /></h2>
          <div className='d-flex flex-wrap flex-row'>
            {this.state.connected &&
              blocks}
            {!this.state.connected &&
              <div>Disconnected</div>}
          </div>
        </div>
      </div>
    )
  }
}

const ConnectionState = ({ connected }) => {
  const statusClass = connected ? 'badge-success' : 'badge-warning'

  return (
    <span className={`badge ${statusClass}`}>{connected ? 'CONNECTED' : 'DICONNECTED'}</span>
  )
}

const appEl = document.getElementById('app')
if (appEl) {
  ReactDOM.render(<App />, appEl)
} else {
  console.error('Cannot find element with id "app"')
}
