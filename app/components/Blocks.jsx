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

export class BlocksContainer extends Component<*> {
  render () {
    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>Blocks</title>
        </Helmet>
        <h2 className='col-md-12 text-center' style={{marginTop: '20px', marginBottom: '20px'}}>Mined Blocks</h2>
      </div>
    )
  }
}

const component = connect(state => ({
  blocks: state.rover.blocks
}))(BlocksContainer)

export default component
