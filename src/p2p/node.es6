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
const pull = require('pull-stream')
const PeerId = require('peer-id')
const PeerBook = require('peer-book')

const logging = require('../logger')
const config = require('../../config/config')

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

const PROTOCOL_VERSION = '0.0.1'
const PROTOCOL_PREFIX = `/bc/${PROTOCOL_VERSION}`
const NETWORK_ID = 1

type StatusMsg = {
  protocolVersion: string,
  peerId: ?string,
}

export default class Node {
  _logger: Object // eslint-disable-line no-undef
  _engine: Object // eslint-disable-line no-undef
  _statusMsg: StatusMsg // eslint-disable-line no-undef
  _peers: PeerBook // eslint-disable-line no-undef

  constructor (engine: Object) {
    this._logger = logging.getLogger(__filename)
    this._statusMsg = { networkId: NETWORK_ID, peerId: null }
    this._peers = new PeerBook()
  }

  start () {
    let node: Bundle

    waterfall([
      (cb) => PeerInfo.create(cb),
      (peerInfo, cb) => {
        peerInfo.multiaddrs.add(config.p2p.rendezvous)

        node = new Bundle(peerInfo)
        node.start(cb)

        node.handle(`${PROTOCOL_PREFIX}/newblock`, (protocol, conn) => {
          pull(
            conn,
            pull.map((v) => v.toString()),
            pull.log() // TODO store to persistence
          )
        })

        node.handle(`${PROTOCOL_PREFIX}/status`, (protocol, conn) => {
          pull(
            conn,
            pull.collect((err, wireData) => {
              if (err) {
                this._logger.warn('Error while processing status')
                return
              }
              try {
                const data = JSON.parse(wireData.toString())
                const { networkId, peerId } = data
                if (networkId !== NETWORK_ID) {
                  this._logger.warn(`Disconnecting peer ${peerId} - network id mismatch ${networkId} / ${NETWORK_ID}`)
                  node.hangUp(new PeerId(peerId), () => {
                    this._logger.info(`${peerId} disconnected`)
                  })
                  return
                }
              } catch (e) {
                this._logger.error('Error while parsing data')
                return
              }
              conn.getPeerInfo((err, peer) => {
                if (err) {
                  this._logger.error(`Cannot get peer info ${err}`)
                  return
                }
                this._peers.put(peer)
                this._logger.info(`Status handled successfuly, added peer ${peer.id.toB58String()}`)
              })
            })
          )
        })
      }
    ], (err) => {
      if (err) {
        console.log(err)
        throw err
      }

      node.on('peer:discovery', (peer) => {
        this._logger.info(`Discovered: ${peer.id.toB58String()}`)
        node.dial(peer, () => {})
      })

      node.on('peer:connect', (peer) => {
        console.log('Connection established:', peer.id.toB58String())
        node.dialProtocol(peer, `${PROTOCOL_PREFIX}/status`, (err, conn) => {
          if (err) {
            node.hangUp(peer, () => {
              console.log(`${peer.id.toB58String()} disconnected, reason: ${err.message}`)
            })
          }
          const msg = this._statusMsg
          msg.peerId = peer.id.toB58String()
          pull(pull.values([JSON.stringify(msg)]), conn)
        })
      })

      node.on('peer:disconnect', (peer) => {
        this._peers.remove(peer)
        this._logger.info(`Peer ${peer.id.toB58String()} disconnected, removed from book`)
      })
    })

    return true
  }
}
