import { reject } from 'ramda'

/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { initialState } from './state'
import { ACTIONS } from './actions'

export const reducer = (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case ACTIONS.PEER_SET:
      const id = action.payload && action.payload.id
      return {...state, id, peer: action.payload}
  }

  return state
}
