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

import Main from './Main'
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
    const props = this.state
    return (
      <div>
        <Navbar connected={this.state.connected} />
        <div className='container-fluid'>
          <div className='container'>
            <Main {...props} />
          </div>
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
      const payload = JSON.parse(data.data)
      if (payload.type === 'block.snapshot') {
        this.setState(merge(this.state, { blocks: payload.blocks }))
      } else if (payload.type === 'block.latest') {
        this.setState(merge(this.state, { blocks: concat(this.state.blocks, [payload.block]) }))
      }
    }
    this._socket.onclose = () => {
      this.setState(merge(this.state, { connected: false }))
      window.setTimeout(this._run.bind(this), 1000)
    }
  }
}
