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
    case ACTIONS.ROVER_ADD_BLOCK:
      const blocks = state.blocks
      blocks.enq(action.payload)
      return {
        ...state,
        count: state.count + 1,
        blocks
      }

    case ACTIONS.ROVER_SET_BLOCKS:
      return {
        ...state,
        count: state.count + action.payload.length,
        blocks: action.payload.reduce((acc, el) => {
          acc.enq(el)
          return acc
        }, state.blocks)
      }
  }

  return state
}
