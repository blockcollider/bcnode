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

import { ACTIONS as SOCKET_ACTIONS } from '../socket/actions'

export class BlockContainer extends Component<*> {
  _fetchBlock (id: String) {
    if (!this.props.block || id !== String(this.props.block.height)) {
      this.props.actions.getBlock(id)
    }
  }
  componentDidMount () {
    this._fetchBlock(this.props.id)
  }

  componentWillReceiveProps (nextProps: Object) {
    this._fetchBlock(nextProps.id)
  }

  render () {
    const blockJson = this.props.block && JSON.stringify(this.props.block, null, 4)
    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>Block</title>
        </Helmet>
        <h2 className='col-md-12 text-center' style={{marginTop: '20px', marginBottom: '20px'}}>Block #{this.props.id}</h2>

        <div className='container bg-light'>
          { blockJson &&
            <pre>
              {blockJson}
            </pre>
          }
        </div>
      </div>
    )
  }
}

const actions = {
  getBlock: (block: Object) => {
    return {
      type: SOCKET_ACTIONS.SOCKET_SEND,
      payload: {
        type: 'block.get',
        data: { id: block }
      }
    }
  }
}

export const ACTIONS = {
  BLOCK_GET: 'BLOCK_GET',
  BLOCK_SET: 'BLOCK_SET'
}

const initialState = {
  id: null,
  block: null
}

export const reducer = (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case ACTIONS.BLOCK_SET:
      const id = action.payload && action.payload.height
      return {...state, id, block: action.payload}
  }

  return state
}

function mapDispatchToProps (dispatch, ownProps) {
  const res = { actions: bindActionCreators(actions, dispatch) }
  return res
}

export const Block = connect(
  (state, ownProps) => {
    const id = ownProps.match.params.id
    let block = state.block.block

    return {
      id,
      block
    }
  },
  mapDispatchToProps
)(BlockContainer)

export default Block
