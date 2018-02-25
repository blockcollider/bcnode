/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow-disabled
 */

import React from 'react'
import ReactDOM from 'react-dom'

const Io = require('socket.io-client')

export default class App extends React.Component {
  constructor() {
    super()

    this._socket = Io({
      path: '/ws'
    })
  }

  render() {
    return <h1>Hello</h1>
  }
}

ReactDOM.render(<App/>, document.getElementById('app'));
