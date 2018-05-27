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
import { PeersTable } from '../components'

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
        <PeersTable peers={this.props.peers} />
      </div>
    )
  }
}

export const Peers = connect(state => ({
  peer: state.profile.peer,
  peers: state.peers.peers
}))(PeersContainer)

export default Peers
