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
    case ACTIONS.MULTIVERSE_SET:
      state.multiverse = action.payload
      return state
  }

  return state
}
