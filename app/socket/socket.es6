/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { ACTIONS as BLOCK_ACTIONS } from '../components/Block'
import { ACTIONS as MINER_ACTIONS } from '../components/Miner'
import { ACTIONS as PEER_ACTIONS } from '../components/Peers'
import { ACTIONS as ROVER_ACTIONS } from '../components/Rover'
import { ACTIONS } from './actions'

const DISPATCH_TABLE = {
  'block.mined': MINER_ACTIONS.MINER_ADD_BLOCK,
  'block.latest': ROVER_ACTIONS.ROVER_ADD_BLOCK,
  'block.set': BLOCK_ACTIONS.BLOCK_SET,
  'block.snapshot': ROVER_ACTIONS.ROVER_SET_BLOCKS,
  'peer.connected': PEER_ACTIONS.PEERS_ADD_PEER,
  'peer.disconnected': PEER_ACTIONS.PEERS_REMOVE_PEER,
  'peer.snapshot': PEER_ACTIONS.PEERS_SET_PEERS
}

export const initSocket = (dispatch : (msg : Object) => void) => {
  const socket = new WebSocket(`ws://${location.hostname}:${location.port}/ws`) // eslint-disable-line

  socket.onopen = () => {
    setTimeout(() => dispatch({type: ACTIONS.SOCKET_CONNECTED}), 1)
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

  dispatch({type: ACTIONS.SOCKET_CREATED, payload: socket})

  return socket
}

const initialState = {
  socket: null,
  connected: false,
  buffer: []
}

export const reducer = (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case ACTIONS.SOCKET_CREATED:
      return { ...state, socket: action.payload }

    case ACTIONS.SOCKET_CONNECTED:
      state.buffer.forEach((msg) => {
        state.socket.send(JSON.stringify(msg))
      })
      return { ...state, connected: true, buffer: [] }

    case ACTIONS.SOCKET_DISCONNECTED:
      return { ...state, connected: false }

    case ACTIONS.SOCKET_SEND:
      if (state.connected) {
        state.socket.send(JSON.stringify(action.payload))
        return state
      }
      return { ...state, buffer: [...state.buffer, action.payload] }

    default:
      return state
  }
}
