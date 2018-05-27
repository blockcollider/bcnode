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
      return { ...state, blocks: [ ...state.blocks, action.payload ] }

    case ACTIONS.ROVER_SET_BLOCKS:
      return { ...state, blocks: action.payload }
  }

  return state
}
