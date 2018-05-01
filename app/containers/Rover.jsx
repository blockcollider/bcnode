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
import { take } from 'ramda'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import RoverBlock from '../components/RoverBlock'

export class RoverContainer extends Component<*> {
  render () {
    const blocks = take(24, this.props.blocks.sort((a, b) => b.timestamp - a.timestamp))
      .map(block => {
        return <RoverBlock {...block} block={block} key={block.hash} />
      })

    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>Rover</title>
        </Helmet>

        <h2 className='col-md-12 text-center' style={{marginTop: '20px', marginBottom: '20px'}}>Collected blocks (last 24)</h2>
        {blocks}
      </div>
    )
  }
}

RoverContainer.propTypes = {
  blocks: PropTypes.instanceOf(Object)
}

const initialState = {
  blocks: []
}

export const ACTIONS = {
  ROVER_ADD_BLOCK: 'ROVER_ADD_BLOCK',
  ROVER_SET_BLOCKS: 'ROVER_SET_BLOCKS'
}

export const reducer = (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case ACTIONS.ROVER_ADD_BLOCK:
      return { ...state, blocks: [ ...state.blocks, action.payload ] }

    case ACTIONS.ROVER_SET_BLOCKS:
      return { ...state, blocks: action.payload }
  }

  return state
}

export const Rover = connect(state => ({
  blocks: state.rover.blocks
}))(RoverContainer)

export default Rover
