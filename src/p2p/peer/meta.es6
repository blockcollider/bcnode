/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const createPeerMeta = (): Object => {
  return {
    p2p: {
      networkId: null
    },
    ts: {
      connectedAt: null,
      startedAt: null
    },
    status: {},
    version: {
      protocol: null,
      npm: null,
      git: {
        short: null,
        long: null
      }
    }
  }
}
