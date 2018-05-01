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

import { BlocksTable } from '../components'
import { bindActionCreators } from 'redux'

import { ACTIONS as SOCKET_ACTIONS } from '../socket/actions'
import { push } from 'react-router-redux'
import { ACTIONS as BLOCK_ACTIONS } from './Block'

export class BlocksContainer extends Component<*> {
  _fetchBlocks (id: String, blocks: Object[], action: Function) {
    if (!blocks ||
       blocks.length < 1 ||
       id === 'latest' ||
       id !== String(blocks[0].id)
    ) {
      console.log('Fetching blocks')
      action(id)
    }
  }

  componentDidMount () {
    this._fetchBlocks(this.props.id, this.props.blocks, this.props.actions.getBlocks)
  }

  componentWillReceiveProps (nextProps: Object) {
    if (this.props.id !== nextProps.id) {
      this._fetchBlocks(nextProps.id, nextProps.blocks,
        this.props.actions.getBlocks)
    }
  }

  render () {
    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>Blocks</title>
        </Helmet>
        <h2 className='col-md-12 text-center' style={{marginTop: '20px', marginBottom: '20px'}}>
          Blocks
        </h2>
        <BlocksTable blocks={this.props.blocks} onClick={this.props.actions.showBlock} />
      </div>
    )
  }
}

const initialState = {
  id: null,
  blocks: []
}

export const ACTIONS = {
  BLOCKS_SET: 'BLOCKS_SET'
}

const actions = (dispatch) => {
  return {
    getBlocks: (block: Object) => {
      return {
        type: SOCKET_ACTIONS.SOCKET_SEND,
        payload: {
          type: 'blocks.get',
          data: {
            id: block
          }
        }
      }
    },

    showBlock: (block: Object) => {
      dispatch(push(`/block/${block.height}`))
      return {
        type: BLOCK_ACTIONS.BLOCK_SET,
        payload: block
      }
    }
  }
}

export const reducer = (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case ACTIONS.BLOCKS_SET:
      return {...state, blocks: action.payload}
  }

  return state
}

function mapDispatchToProps (dispatch, ownProps) {
  const res = { actions: bindActionCreators(actions(dispatch), dispatch) }
  return res
}
const Blocks = connect(
  (state, ownProps) => {
    const id = ownProps.match.params.id
    let blocks = state.blocks.blocks

    return {
      id,
      blocks
    }
  },
  mapDispatchToProps
)(BlocksContainer)

export default Blocks
