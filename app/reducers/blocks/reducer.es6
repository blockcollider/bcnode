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
    case ACTIONS.BLOCKS_ANNOUNCED_ADD:
      let announcedBlocks = state.announced.blocks
      action.payload.timestamp = new Date(action.payload.timestamp)
      announcedBlocks.enq(action.payload)
      return {
        ...state,
        announced: {
          ...state.announced,
          count: state.announced.count + 1,
          blocks: announcedBlocks
        }
      }

    case ACTIONS.BLOCKS_MINED_ADD:
      let minedBlocks = state.mined.blocks
      action.payload.timestamp = new Date(action.payload.timestamp)
      minedBlocks.enq(action.payload)
      return {
        ...state,
        mined: {
          ...state.mined,
          count: state.mined.count + 1,
          blocks: minedBlocks
        }
      }

    case ACTIONS.BLOCKS_STORED_SET:
      return {
        ...state,
        stored: {
          ...state.stored,
          id: action.payload[0].height,
          blocks: action.payload
        }
      }
  }

  return state
}
