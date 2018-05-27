/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const wrtc = require('wrtc')
const WStar = require('libp2p-webrtc-star')
const PeerInfo = require('peer-info')

const config = require('../../../config/config')

export default {
  initialize: (peerInfo: PeerInfo) => {
    return new WStar({
      wrtc: wrtc,
      id: peerInfo.id
    })
  },

  getAddress: (peerInfo: PeerInfo) => {
    return `${config.p2p.rendezvous.webrtc}/ipfs/${peerInfo.id.toB58String()}`
  }
}
