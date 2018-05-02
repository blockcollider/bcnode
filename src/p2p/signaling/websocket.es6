/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// $FlowFixMe
const WSStar = require('libp2p-websocket-star')
const PeerInfo = require('peer-info')

const config = require('../../../config/config')

class BcWSStar extends WSStar {
}

export default {
  initialize: (peerInfo: PeerInfo) => {
    const wsstar = new BcWSStar({
      id: peerInfo.id
    })

    return wsstar
  },

  getAddress: (peerInfo: PeerInfo) => {
    return `${config.p2p.rendezvous.websocket}/ipfs/${peerInfo.id.toB58String()}`
  }
}
