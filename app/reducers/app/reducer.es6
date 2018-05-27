/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import keyboard from 'keyboardjs'
import { ACTIONS } from './actions'
import { initialState } from './state'

export const init = (dispatch : (msg : Object) => void) => {
  keyboard.bind('d', (e) => {
    console.log('d is pressed', e)
    dispatch({type: ACTIONS.APP_DEBUG_TOGGLE})
  })
}

export const reducer = (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case ACTIONS.APP_DEBUG_TOGGLE:
      return { ...state, config: { debug: !state.config.debug } }
  }

  return state
}
