/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import SocketIO from 'socket.io-client'

import { ACTIONS as PROFILE_ACTIONS } from '../profile/actions'
import { ACTIONS as BLOCK_ACTIONS } from '../block/actions'
import { ACTIONS as BLOCKS_ACTIONS } from '../blocks/actions'
import { ACTIONS as MAP_ACTIONS } from '../map/actions'
import { ACTIONS as MULTIVERSE_ACTIONS } from '../multiverse/actions'
import { ACTIONS as PEER_ACTIONS } from '../peers/actions'
import { ACTIONS as ROVER_ACTIONS } from '../rover/actions'

import { ACTIONS } from './actions'
import { initialState } from './state'

const DISPATCH_TABLE = {
  'block.announced': BLOCKS_ACTIONS.BLOCKS_ANNOUNCED_ADD,
  'block.mined': BLOCKS_ACTIONS.BLOCKS_MINED_ADD,
  'block.latest': ROVER_ACTIONS.ROVER_ADD_BLOCK,
  'block.set': BLOCK_ACTIONS.BLOCK_SET,
  'block.snapshot': ROVER_ACTIONS.ROVER_SET_BLOCKS,
  'blocks.set': BLOCKS_ACTIONS.BLOCKS_STORED_SET,
  'map.peers': MAP_ACTIONS.MAP_PEERS,
  'multiverse.set': MULTIVERSE_ACTIONS.MULTIVERSE_SET,
  'peer.connected': PEER_ACTIONS.PEERS_ADD_PEER,
  'peer.disconnected': PEER_ACTIONS.PEERS_REMOVE_PEER,
  'peer.snapshot': PEER_ACTIONS.PEERS_SET_PEERS,
  'peer.stats': PEER_ACTIONS.PEERS_STATS,
  'peer.count': PEER_ACTIONS.PEERS_COUNT,
  'profile.set': PROFILE_ACTIONS.PROFILE_SET
}

export const init = (dispatch : (msg : Object) => void) => {
  const socket = SocketIO(`wss://${location.hostname}:${location.port}`, {
    path: '/ws',
    transports: [
      'websocket',
      'polling'
    ]
  })

  socket.on('connect', () => {
    setTimeout(() => dispatch({type: ACTIONS.SOCKET_CONNECTED}), 1)

    socket.on('disconnect', () => {
      setTimeout(() => dispatch({type: ACTIONS.SOCKET_DISCONNECTED}), 1)
    })

    const events = Object.keys(DISPATCH_TABLE)
    events.forEach((event) => {
      console.log('Registering event handler', event)
      socket.on(event, (data) => {
        console.log('Socket event', event, data)
        dispatch({type: DISPATCH_TABLE[event], payload: data})
      })
    })
  })

  dispatch({type: ACTIONS.SOCKET_CREATED, payload: socket})

  return socket
}

export const reducer = (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case ACTIONS.SOCKET_CREATED:
      return { ...state, socket: action.payload }

    case ACTIONS.SOCKET_CONNECTED:
      state.buffer.forEach((msg) => {
        state.socket.emit(msg.type, msg.data)
      })
      return { ...state, connected: true, buffer: [] }

    case ACTIONS.SOCKET_DISCONNECTED:
      return { ...state, connected: false }

    case ACTIONS.SOCKET_SEND:
      if (state.connected) {
        state.socket.emit(action.payload.type, action.payload.data)
        return state
      }
      return { ...state, buffer: [...state.buffer, action.payload] }

    default:
      return state
  }
}
