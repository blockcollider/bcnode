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
import { push } from 'react-router-redux'
import CircularBuffer from 'circular-buffer'

import { ACTIONS as BLOCK_ACTIONS } from './Block'
import { BlocksTable } from '../components'

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

const initialState = {
  blocks: new CircularBuffer(20)
}

export const ACTIONS = {
  MINER_ADD_BLOCK: 'MINER_ADD_BLOCK'
}

export const reducer = (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case ACTIONS.MINER_ADD_BLOCK:
      let data = state.blocks
      action.payload.timestamp = new Date(action.payload.timestamp)
      data.enq(action.payload)
      return { ...state, blocks: data, blocksArray: data.toarray() }

    default:
      return state
  }
}

const actions = (dispatch) => {
  return {
    showBlock: (block: Object) => {
      dispatch(push(`/block/${block.height}`))
      return {
        type: BLOCK_ACTIONS.BLOCK_SET,
        payload: block
      }
    }
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
