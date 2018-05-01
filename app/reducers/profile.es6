/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const initialState = {
  peer: null
}

export const ACTIONS = {
  PROFILE_SET: 'PROFILE_SET'
}

export const reducer = (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case ACTIONS.PROFILE_SET:
      return { ...state, ...action.payload }
  }

  return state
}
