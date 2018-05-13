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

export class DocContainer extends Component<*> {
  render () {
    return (
      <div>
        <Helmet>
          <title>Doc</title>
        </Helmet>

        <iframe
          src='/doc'
          frameBorder={0}
          height={this.props.window.size.height - 60}
          width={this.props.window.size.width}
        />
      </div>
    )
  }
}

const Doc = connect(state => ({
  window: state.app.window
}))(DocContainer)

export default Doc
