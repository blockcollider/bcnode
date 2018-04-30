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
import moment from 'moment'
import CircularBuffer from 'circular-buffer'

import { ACTIONS as BLOCK_ACTIONS } from './Block'

export class MinerContainer extends Component<*> {
  render () {
    let id = 0

    const blocks = this.props.blocks.map((block) => {
      return (
        <tr key={block.hash}>
          <th scope='row'>{id++}</th>
          <td>{block.height}</td>
          <td>
            <a
              href='javascript:void(0)'
              onClick={() => this.props.actions.showBlock(block)}
              style={{color: 'black'}}
            >
              {block.hash}
            </a>
          </td>
          <td>{moment(block.timestamp).format('HH:mm:ss')}</td>
        </tr>
      )
    })

    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>Miner</title>
        </Helmet>

        <h2 className='col-md-12 text-center' style={{marginTop: '20px', marginBottom: '20px'}}>Mined blocks (last 20)</h2>
        <table className='table table-light table-striped'>
          <thead className='thead-light'>
            <tr>
              <th scope='col'>#</th>
              <th scope='col'>Height</th>
              <th scope='col'>Hash</th>
              <th scope='col'>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            { blocks }
          </tbody>
        </table>
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
      action.payload.timestamp = new Date(action.payload.timestamp * 1000)
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

const component = connect(
  state => ({
    blocks: state.miner.blocks.toarray()
  }),
  mapDispatchToProps
)(MinerContainer)

export default component
