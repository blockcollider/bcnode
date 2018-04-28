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

// RoverContainer.propTypes = {
//   blocks: PropTypes.instanceOf(Object)
// }
//
// const initialState = {
//   blocks: []
// }
//
// export const ACTIONS = {
//   ROVER_ADD_BLOCK: 'ROVER_ADD_BLOCK',
//   ROVER_SET_BLOCKS: 'ROVER_SET_BLOCKS'
// }
//
// export const reducer = (state: Object = initialState, action: Object) => {
//   switch (action.type) {
//     case ACTIONS.ROVER_ADD_BLOCK:
//       return { ...state, blocks: [ ...state.blocks, action.payload ] }
//
//     case ACTIONS.ROVER_SET_BLOCKS:
//       return { ...state, blocks: action.payload }
//   }
//
//   return state
// }

const component = connect(state => ({
  blocks: state.rover.blocks
}))(BlocksContainer)

export default component
