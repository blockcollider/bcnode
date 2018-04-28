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
import moment from 'moment'

// import { take } from 'ramda'

import CircularBuffer from 'circular-buffer'

export class MinerContainer extends Component<*> {
  render () {
    let id = 0

    const blocks = this.props.blocks.map((block) => {
      return (
        <tr key={block.hash}>
          <th scope='row'>{id++}</th>
          <td>{block.height}</td>
          <td>{block.hash}</td>
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
  }

  return state
}

const component = connect(state => ({
  blocks: state.miner.blocks.toarray()
}))(MinerContainer)

export default component
