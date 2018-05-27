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
import { bindActionCreators } from 'redux'

import { BlocksTable } from '../components'

import { actions } from '../reducers/miner/actions'

export class MinerContainer extends Component<*> {
  render () {
    let extraCols = []
    if (this.props.config.debug) {
      extraCols = [
        ['Iterations', 'iterations'],
        ['Time Diff', 'timeDiff']
      ]
    }

    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>Miner</title>
        </Helmet>

        <h2 className='col-md-12 text-center' style={{marginTop: '20px', marginBottom: '20px'}}>
          Mined blocks (last 20)
        </h2>
        <BlocksTable blocks={this.props.blocks} extraCols={extraCols} onClick={this.props.actions.showBlock} />
      </div>
    )
  }
}

function mapDispatchToProps (dispatch) {
  return { actions: bindActionCreators(actions(dispatch), dispatch) }
}

export const Miner = connect(
  state => ({
    config: state.app.config,
    blocks: state.miner.blocks.toarray()
  }),
  mapDispatchToProps
)(MinerContainer)

export default Miner
