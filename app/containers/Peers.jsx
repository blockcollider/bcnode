/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import moment from 'moment'
import { reject } from 'ramda'
import React, { Component } from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { VersionLink, PeersTable } from '../components'

export class PeersContainer extends Component<*> {
  render () {
    let peer = []
    if (this.props.peer) {
      peer = [this.props.peer]
    }
    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>Peers</title>
        </Helmet>

        <h2 className='col-md-12 text-center' style={{marginTop: '20px', marginBottom: '20px'}}>
          You
        </h2>

        <PeersTable peers={peer} />

        <h2 className='col-md-12 text-center' style={{marginTop: '20px', marginBottom: '20px'}}>
          Peers
        </h2>
        <PeersTable peers={this.props.peers} />
      </div>
    )
  }
}

const transformFromWire = (obj: Object): Object => {
  const meta = (obj && obj.meta) || {}

  const connectedAt = meta.ts && meta.ts.connectedAt
  if (connectedAt) {
    meta.ts.connectedAt = new Date(connectedAt)
  }

  const startedAt = meta.ts && meta.ts.startedAt
  if (connectedAt) {
    meta.ts.startedAt = new Date(startedAt)
  }

  return obj
}

const initialState = {
  peer: null,
  peers: []
}

export const ACTIONS = {
  PEERS_ADD_PEER: 'PEERS_ADD_PEER',
  PEERS_REMOVE_PEER: 'PEERS_REMOVE_PEER',
  PEERS_SET_PEERS: 'PEERS_SET_PEERS'
}

export const reducer = (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case ACTIONS.PEERS_ADD_PEER:
      const newPeer = transformFromWire(action.payload)
      const oldPeers = reject((peer) => peer.id === newPeer.id, state.peers)
      return { ...state, peers: [ ...oldPeers, newPeer ] }

    case ACTIONS.PEERS_REMOVE_PEER:
      return { ...state, peers: reject((peer) => peer.id === action.payload.id, state.peers) }

    case ACTIONS.PEERS_SET_PEERS:
      return { ...state, peers: action.payload.map(transformFromWire) }
  }

  return state
}

export const Peers = connect(state => ({
  peer: state.profile.peer,
  peers: state.peers.peers
}))(PeersContainer)

export default Peers
