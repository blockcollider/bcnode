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

import { PeersTable } from '../components'
import { actions } from '../reducers/peers/actions'

export class PeersContainer extends Component<*> {
  render () {
    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>Peers</title>
        </Helmet>

        <h2 className='col-md-12 text-center' style={{marginTop: '20px', marginBottom: '20px'}}>
          Peers
        </h2>
        <PeersTable peers={this.props.peers} onClick={this.props.actions.showPeer} />
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
    let peers = sortBy(compose(toLower, prop('id')), state.peers.peers || [])
    return {
      peers
    }
  },
  mapDispatchToProps
)(PeersContainer)

export default Peers
