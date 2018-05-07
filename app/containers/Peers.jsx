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
import { compose, prop, sortBy, toLower } from 'ramda'
import { round } from 'mathjs'

import {
  BlocksTable,
  PeersTable
} from '../components'
import { actions } from '../reducers/peers/actions'

export class PeersContainer extends Component<*> {
  render () {
    // const renderAnnouncedBlocks = () => (
    //   <div className='no-gutters'>
    //     <h2 className='col-md-12 text-center' style={{marginTop: '20px', marginBottom: '20px'}}>
    //       Announced blocks (last 20 of {this.props.blocksCount})
    //     </h2>
    //     <BlocksTable blocks={this.props.blocks} extraCols={[['Miner', 'miner']]} onClick={() => {}} />
    //   </div>
    // )

    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>Peers</title>
        </Helmet>

        <h2 className='col-md-12 text-center' style={{marginTop: '20px', marginBottom: '20px'}}>
          Peers
        </h2>
        <PeersTable peers={this.props.peers} onClick={this.props.actions.showPeer} />

        <h2 className='col-md-12 text-center' style={{marginTop: '20px', marginBottom: '20px'}}>
          Announced blocks (last {this.props.blocks.capacity()} of {this.props.blocksCount}, BPS: {round(this.props.blocksCount / this.props.timeDiff, 3)})
        </h2>
        <BlocksTable blocks={this.props.blocks.toarray()} extraCols={[['Miner', 'miner']]} onClick={() => {}} />
      </div>
    )
  }
}

function mapDispatchToProps (dispatch, ownProps) {
  return {
    actions: bindActionCreators(actions(dispatch), dispatch)
  }
}
const Peers = connect(
  (state) => {
    const peers = sortBy(compose(toLower, prop('id')), state.peers.peers || [])
    // let timeDiff = state.peers.timeDiff || (Date.now() - state.app.ts.startedAt) * 0.001
    const timeDiff = (Date.now() - state.app.ts.startedAt) * 0.001

    return {
      blocks: state.blocks.announced.blocks,
      blocksCount: state.blocks.announced.count,
      config: state.app.config,
      peers,
      timeDiff
    }
  },
  mapDispatchToProps
)(PeersContainer)

export default Peers
