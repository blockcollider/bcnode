/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { ACTIONS as SOCKET_ACTIONS } from '../socket/actions'

export const ACTIONS = {
  MULTIVERSE_GET: 'MULTIVERSE_GET',
  MULTIVERSE_SET: 'MULTIVERSE_SET'
}

export const actions = (dispatch: Function) => {
  return {
    purgeMultiverse: () => {
      return {
        type: SOCKET_ACTIONS.SOCKET_SEND,
        payload: {
          type: 'multiverse.purge',
          data: {}
        }
      }
    },

    getMultiverse: () => {
      return {
        type: SOCKET_ACTIONS.SOCKET_SEND,
        payload: {
          type: 'multiverse.get',
          data: {}
        }
      }
    }
  }
}
