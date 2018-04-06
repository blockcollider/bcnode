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
const waterfall = require('async/waterfall')

const logging = require('../logger')

class Bundle extends libp2p {
  constructor (peerInfo) {
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

    super(modules, peerInfo)
  }
}

export default class Node {
  _logger: Object; // eslint-disable-line no-undef
  _engine: Object // eslint-disable-line no-undef

  constructor (engine: Object) {
    this._logger = logging.getLogger(__filename)
  }

  start () {
    let node: Bundle

    waterfall([
      (cb) => PeerInfo.create(cb),
      (peerInfo, cb) => {
        peerInfo.multiaddrs.add('/dns4/46.101.138.77/tcp/9090/ws/p2p-webrtc-star/')

        node = new Bundle(peerInfo)
        node.start(cb)
      }
    ], (err) => {
      if (err) {
        console.log(err)
        throw err
      }

      node.on('peer:discovery', (peer) => {
        console.log('Discovered:', peer.id.toB58String())
        node.dial(peer, () => {
          // peer.sendMessage('aaa')
        })
      })

      node.on('peer:connect', (peer) => {
        console.log('Connection established:', peer.id.toB58String())
      })

      node.on('peer:disconnect', (peer) => {
        console.log('Connection closed:', peer.id.toB58String())
      })
    })

    return true
  }
}
