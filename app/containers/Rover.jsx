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
      .map((block, idx) => {
        return <RoverBlock {...block} block={block} network={this.props.network} key={idx} />
      })

    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>ROVER</title>
        </Helmet>

        <h2 className='col-md-12 text-center' style={{marginTop: '16px', marginBottom: '9px'}}>
             LAST {Math.min(this.props.blocks.capacity(), this.props.blocksCount)} ROVERED BLOCKS
        </h2>
        {blocks}
      </div>
    )
  }
}

RoverContainer.propTypes = {
  blocks: PropTypes.instanceOf(Object),
  network: PropTypes.string
}

export const Rover = connect(state => ({
  blocks: state.rover.blocks,
  blocksCount: state.rover.count,
  network: state.profile.network
}))(RoverContainer)

export default Rover
