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
import { concat, take } from 'ramda'

import Block from './Block.jsx'

type State = {
  blocks: Object[]
}
export default class App extends Component<*, State> {
  _socket: any

  constructor () {
    super()
    this.state = { blocks: [] }
    this._socket = new WebSocket(`ws://${location.hostname}:${location.port}/ws`) // eslint-disable-line
  }

  componentDidMount () {
    this._socket.onmessage = (data) => {
      this.setState({ blocks: concat(this.state.blocks, [JSON.parse(data.data)]) })
    }
  }

  componentWillUnmount () {
    this._socket.close()
  }

  render () {
    const blocks = take(20, this.state.blocks).sort((a, b) => b.timestamp - a.timestamp).map(block => {
      return <Block {...block} key={block.data.hash} />
    })
    return (
      <div className='container'>
        <h1>Blockcollider</h1>
        <div className='container'>
          <h2>Collected blocks (last 20)</h2>
          <div className='d-flex flex-wrap flex-row'>
            {blocks}
          </div>
        </div>
      </div>
    )
  }
}

const appEl = document.getElementById('app')
if (appEl) {
  ReactDOM.render(<App />, appEl)
} else {
  console.error('Cannot find element with id "app"')
}
