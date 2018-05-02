/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { push } from 'react-router-redux'

import { ACTIONS as BLOCK_ACTIONS } from '../block/actions'
import { ACTIONS as SOCKET_ACTIONS } from '../socket/actions'

import { initialState } from './state'

export const ACTIONS = {
  BLOCKS_SET: 'BLOCKS_SET'
}

export const actions = (dispatch: Function) => {
  return {
    getBlocks: (id: Object, count: number = initialState.count) => {
      return {
        type: SOCKET_ACTIONS.SOCKET_SEND,
        payload: {
          type: 'blocks.get',
          data: {
            id,
            count
          }
        }
      }
    },

    showBlock: (block: Object) => {
      dispatch(push(`/block/${block.height}`))
      return {
        type: BLOCK_ACTIONS.BLOCK_SET,
        payload: block
      }
    }
  }
}
