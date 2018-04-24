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
import { connect } from 'react-redux'

export class PeersContainer extends Component<*> {
  render () {
    let id = 0
    const peers = this.props.peers.map((peer) => {
      const protocolVersion = peer.status && peer.status.protocolVersion
      const gitVersion = (
        peer.status &&
        peer.status.version &&
        peer.status.version.git &&
        peer.status.version.git.short
      ) || '<unknown>'

      const npmVersion = (
        peer.status &&
        peer.status.version &&
        peer.status.version.npm
      ) || '<unknown>'

      const version = `${npmVersion}/${gitVersion}`

      const connectedAgo = (
        peer.status &&
        peer.status.connectedAt &&
        moment(peer.status.connectedAt).fromNow()
      ) || '<unknown>'

      return (
        <tr key={peer.id}>
          <th scope='row'>{id++}</th>
          <td>{peer.id}</td>
          <td>{protocolVersion}</td>
          <td>{version}</td>
          <td>{connectedAgo}</td>
        </tr>
      )
    })

    return (
      <div className='d-flex flex-wrap flex-row'>
        <h2 className='col-md-12 text-center' style={{marginTop: '20px', marginBottom: '20px'}}>Peers</h2>

        <table className='table table-light table-striped'>
          <thead className='thead-light'>
            <tr>
              <th scope='col'>#</th>
              <th scope='col'>ID</th>
              <th scope='col'>Protocol Version</th>
              <th scope='col'>Version</th>
              <th scope='col'>Connected</th>
            </tr>
          </thead>
          <tbody>
            { peers}
          </tbody>
        </table>
      </div>
    )
  }
}

const transformFromWire = (obj: Object): Object => {
  const connectedAt = obj && obj.status && obj.status.connectedAt
  if (connectedAt) {
    obj.status.connectedAt = new Date(connectedAt)
  }

  return obj
}

const initialState = {
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
      return { ...state, peers: [ ...state.peers, transformFromWire(action.payload) ] }

    case ACTIONS.PEERS_REMOVE_PEER:
      return { ...state, peers: reject((peer) => peer.id === action.payload.id, state.peers) }

    case ACTIONS.PEERS_SET_PEERS:
      return { ...state, peers: action.payload.map(transformFromWire) }
  }

  return state
}

const component = connect(state => ({
  peers: state.peers.peers
}))(PeersContainer)

export default component
