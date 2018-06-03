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
    const blocks = take(24, this.props.blocks.toarray().sort((a, b) => b.timestamp - a.timestamp))
      .map(block => {
        return <RoverBlock {...block} block={block} key={block.hash} />
      })

    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>Rover</title>
        </Helmet>

        <h2 className='col-md-12 text-center' style={{marginTop: '16px', marginBottom: '16px'}}>
            {this.props.blocksCount} member chain blocks discovered  
        </h2>
        {blocks}
      </div>
    )
  }
}

RoverContainer.propTypes = {
  blocks: PropTypes.instanceOf(Object)
}

export const Rover = connect(state => ({
  blocks: state.rover.blocks,
  blocksCount: state.rover.count
}))(RoverContainer)

export default Rover
