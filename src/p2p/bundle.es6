/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const wrtc = require('wrtc')
const libp2p = require('libp2p')
const Mplex = require('libp2p-mplex')
const SECIO = require('libp2p-secio')
const WStar = require('libp2p-webrtc-star')
const PeerInfo = require('peer-info')
const PeerBook = require('peer-book')

export default class Bundle extends libp2p {
  constructor (peerInfo: PeerInfo, peerBook: ?PeerBook, options: ?Object) {
    const ws = new WStar({
      wrtc: wrtc
    })

    const modules = {
      transport: [
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

    super(modules, peerInfo, peerBook, options)
  }
}
