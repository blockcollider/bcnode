/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { push } from 'react-router-redux'
import { ACTIONS as PEER_ACTIONS } from '../peer/actions'

export const ACTIONS = {
  PEERS_ADD_PEER: 'PEERS_ADD_PEER',
  PEERS_REMOVE_PEER: 'PEERS_REMOVE_PEER',
  PEERS_SET_PEERS: 'PEERS_SET_PEERS',
  PEERS_STATS: 'PEERS_STATS'
}

export const actions = (dispatch: Function) => {
  return {
    showPeer: (peer: Object) => {
      dispatch(push(`/peer/${peer.id}`))
      return {
        type: PEER_ACTIONS.PEER_SET,
        payload: peer
      }
    }
  }
}
