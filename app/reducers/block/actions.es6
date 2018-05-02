/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { ACTIONS as SOCKET_ACTIONS } from '../socket/actions'

export const actions = {
  getBlock: (block: Object) => {
    return {
      type: SOCKET_ACTIONS.SOCKET_SEND,
      payload: {
        type: 'block.get',
        data: { id: block }
      }
    }
  }
}

export const ACTIONS = {
  BLOCK_GET: 'BLOCK_GET',
  BLOCK_SET: 'BLOCK_SET'
}
