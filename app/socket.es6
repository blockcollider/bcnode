/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { ACTIONS as ROVER_ACTIONS } from './components/Rover'
import { ACTIONS as PEER_ACTIONS } from './components/Peers'

export const ACTIONS = {
  SOCKET_CREATED: 'SOCKET_CREATED',
  SOCKET_CONNECTED: 'SOCKET_CONNECTED',
  SOCKET_DISCONNECTED: 'SOCKET_DISCONNECTED'
}

const DISPATCH_TABLE = {
  'block.latest': ROVER_ACTIONS.ROVER_ADD_BLOCK,
  'block.snapshot': ROVER_ACTIONS.ROVER_SET_BLOCKS,
  'peer.connected': PEER_ACTIONS.PEERS_ADD_PEER,
  'peer.disconnected': PEER_ACTIONS.PEERS_REMOVE_PEER,
  'peer.snapshot': PEER_ACTIONS.PEERS_SET_PEERS
}

export const initSocket = (dispatch : (msg : Object) => void) => {
  const socket = new WebSocket(`ws://${location.hostname}:${location.port}/ws`) // eslint-disable-line
  dispatch({type: ACTIONS.SOCKET_CREATED, payload: socket})

  socket.onopen = () => {
    dispatch({type: ACTIONS.SOCKET_CONNECTED})
  }

  socket.onclose = () => {
    dispatch({type: ACTIONS.SOCKET_DISCONNECTED})
    window.setTimeout(() => initSocket(dispatch), 1000)
  }

  socket.onmessage = (data) => {
    // $FlowFixMe
    const payload = JSON.parse(data.data)

    const dispatchAction = DISPATCH_TABLE[payload.type]
    if (dispatchAction) {
      return dispatch({type: dispatchAction, payload: payload.data})
    }
  }

  return socket
}

const initialState = {
  socket: null,
  connected: false
}

export const reducer = (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case ACTIONS.SOCKET_CREATED:
      return { ...state, socket: action.payload }

    case ACTIONS.SOCKET_CONNECTED:
      return { ...state, connected: true }

    case ACTIONS.SOCKET_DISCONNECTED:
      return { ...state, connected: false }

    default:
      return state
  }
}
