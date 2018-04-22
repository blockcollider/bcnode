/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// const wrtc = require('wrtc')
const libp2p = require('libp2p')
const Mplex = require('libp2p-mplex')
const SECIO = require('libp2p-secio')
// const WStar = require('p2p-webrtc-star')
const WSStar = require('libp2p-websocket-star')
const PeerInfo = require('peer-info')
const PeerBook = require('peer-book')
const TCP = require('libp2p-tcp')

export default class Bundle extends libp2p {
  constructor (peerInfo: PeerInfo, peerBook: ?PeerBook, options: ?Object) {
    const ws = new WSStar({
      // wrtc: wrtc,
      id: peerInfo.id
    })

    const modules = {
      transport: [
        new TCP(),
        ws
      ],
      connection: {
        muxer: [
          Mplex
        ],
        crypto: [
          SECIO
        ]
      },
      discovery: [
        ws.discovery
      ]
    }

    super(modules, peerInfo)
  }
}
