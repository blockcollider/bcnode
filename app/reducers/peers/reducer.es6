import { reject } from 'ramda'

/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { ACTIONS } from './actions'
import { initialState } from './state'

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
