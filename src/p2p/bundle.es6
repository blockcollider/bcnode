/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import { BcPeerBook } from './peer/book'

const libp2p = require('libp2p')
const KadDHT = require('libp2p-kad-dht')
const Mplex = require('libp2p-mplex')
const MDNS = require('libp2p-mdns')
const SECIO = require('libp2p-secio')
const PeerInfo = require('peer-info')
const TCP = require('libp2p-tcp')

export default class Bundle extends libp2p {
  peerInfo: BcPeerBook
  peerBook: ?BcPeerBook
  options: Object

  constructor (peerInfo: PeerInfo, peerBook: BcPeerBook, opts: Object) {
    const signaling = opts.signaling
    const modules = {
      transport: [
        new TCP(),
        signaling
      ],
      connection: {
        muxer: [
          Mplex
        ],
        crypto: [ SECIO ]
      },
      discovery: [
        new MDNS(peerInfo, { interval: 3000, broadcast: true }),
        signaling.discovery
      ],
      DHT: KadDHT
    }

    super(modules, peerInfo, peerBook, opts)
  }
}
