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
