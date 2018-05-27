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

export const reducer = (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case ACTIONS.MINER_ADD_BLOCK:
      let data = state.blocks
      action.payload.timestamp = new Date(action.payload.timestamp)
      data.enq(action.payload)
      return { ...state, blocks: data, blocksArray: data.toarray() }

    default:
      return state
  }
}
