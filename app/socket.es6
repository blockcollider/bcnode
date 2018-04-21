/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { ACTIONS as ROVER_ACTIONS } from './components/Rover'

export const ACTIONS = {
  SOCKET_CREATED: 'SOCKET_CREATED',
  SOCKET_CONNECTED: 'SOCKET_CONNECTED',
  SOCKET_DISCONNECTED: 'SOCKET_DISCONNECTED'
}

export const initSocket = (dispatch : (msg : Object) => void) => {
  const socket = new WebSocket(`ws://${location.hostname}:${location.port}/ws`) // eslint-disable-line
  dispatch({type: ACTIONS.SOCKET_CREATED, payload: socket})

  socket.onopen = () => {
    dispatch({type: ACTIONS.SOCKET_CONNECTED})
  }

  socket.onmessage = (data) => {
    // $FlowFixMe
    const payload = JSON.parse(data.data)
    if (payload.type === 'block.snapshot') {
      dispatch({type: ROVER_ACTIONS.ROVER_SET_BLOCKS, payload: payload.blocks})
    } else if (payload.type === 'block.latest') {
      dispatch({type: ROVER_ACTIONS.ROVER_ADD_BLOCK, payload: payload.block})
    }
  }

  socket.onclose = () => {
    dispatch({type: ACTIONS.SOCKET_DISCONNECTED})
    window.setTimeout(() => initSocket(dispatch), 1000)
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
