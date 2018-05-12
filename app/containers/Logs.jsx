/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'

export class LogsContainer extends Component<*> {
  render () {
    // const style = {
    //   backgroundColor: 'white'
    // }
    return (
      <div>
        <Helmet>
          <title>Logs</title>
        </Helmet>

        <iframe
          src='/logs'
          frameBorder={0}
          height={this.props.window.size.height - 60}
          width={this.props.window.size.width}
        />
      </div>
    )
  }
}

const Logs = connect(state => ({
  window: state.app.window
}))(LogsContainer)

export default Logs
