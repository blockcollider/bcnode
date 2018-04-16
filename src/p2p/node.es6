/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { inspect } = require('util')

const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const PeerBook = require('peer-book')
const waterfall = require('async/waterfall')
const pull = require('pull-stream')

const Engine = require('../engine').default
const logging = require('../logger')
const { BcBlock } = require('../protos/core_pb')
const config = require('../../config/config')
const Bundle = require('./bundle').default

const PROTOCOL_VERSION = '0.0.1'
const PROTOCOL_PREFIX = `/bc/${PROTOCOL_VERSION}`
const NETWORK_ID = 1

type StatusMsg = {
  networkId: number,
  peerId: ?string,
}

export default class Node {
  _logger: Object // eslint-disable-line no-undef
  _engine: Engine // eslint-disable-line no-undef
  _statusMsg: StatusMsg // eslint-disable-line no-undef
  _peers: PeerBook // eslint-disable-line no-undef
  _node: Bundle // eslint-disable-line no-undef

  constructor (engine: Engine) {
    this._engine = engine
    this._logger = logging.getLogger(__filename)
    this._statusMsg = {
      networkId: NETWORK_ID,
      peerId: null
    }
    this._peers = new PeerBook()
  }

  get node (): Bundle {
    return this._node
  }

  start () {
    let node: Bundle

    const pipeline = [
      (cb) => PeerInfo.create(cb),
      (peerInfo, cb) => {
        peerInfo.multiaddrs.add(config.p2p.rendezvous)

        node = new Bundle(peerInfo, this._peers)
        this._logger.debug(`Staring p2p node (self) with ${peerInfo.id.toB58String()}`)
        node.start(cb)

        this._node = node

        this._registerMessageHandlers(node)
      }
    ]

    waterfall(pipeline, (err) => {
      if (err) {
        this._logger.error(err)
        throw err
      }

      this._registerEventHandlers(node)
    })

    return true
  }

  broadcastNewBlock (method: string, block: BcBlock) {
    this._logger.info(`Broadcasting msg to peers, ${inspect(block.toObject())}`)

    const url = `${PROTOCOL_PREFIX}/${method}`
    this._peers.getAllArray().map(peer => {
      this._logger.info(`Sending to peer ${peer}`)
      this.node.dialProtocol(peer, url, (err, conn) => {
        if (err) {
          this._logger.error('Error sending message to peer', peer, err)
        }

        pull(pull.values([block.serializeBinary()]), conn)
      })
    })
  }

  _handleEventPeerConnect (node: Bundle, peer: Object) {
    this._logger.info('Connection established:', peer.id.toB58String())
    node.dialProtocol(peer, `${PROTOCOL_PREFIX}/status`, (err, conn) => {
      if (err) {
        node.hangUp(peer, () => {
          this._logger.error(`${peer.id.toB58String()} disconnected, reason: ${err.message}`)
        })
      }
      const msg = this._statusMsg
      msg.peerId = peer.id.toB58String()
      pull(pull.values([JSON.stringify(msg)]), conn)
    })
  }

  _handleEventPeerDisconnect (peer: Object) {
    this._peers.remove(peer)
    this._logger.info(`Peer ${peer.id.toB58String()} disconnected, removed from book`)
  }

  _handleEventPeerDiscovery (node: Bundle, peer: Object) {
    this._logger.info(`Discovered: ${peer.id.toB58String()}`)
    node.dial(peer, (err) => {
      if (err) {
        this._logger.warn(`Error while dialing discovered peer ${peer.id.toB58String()}`)
      }
    })
  }

  _handleMessageNewBlock (protocol: Object, conn: Object) {
    pull(
      conn,
      pull.collect((err, wireData) => {
        if (err) {
          console.log('ERROR _handleMessageNewBlock()', err, wireData)
          return
        }

        try {
          const bytes = wireData[0]
          const raw = new Uint8Array(bytes)
          const block = BcBlock.deserializeBinary(raw)
          this._logger.info('Received new block from peer', block.toObject())
        } catch (e) {
          this._logger.error(`Error decoding block from peer, reason: ${e.message}`)
        }
      })
    )
  }

  _handleMessageStatus (node: Bundle, protocol: Object, conn: Object) {
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
  }

  _registerEventHandlers (node: Bundle) {
    node.on('peer:discovery', (peer) => this._handleEventPeerDiscovery(node, peer))
    node.on('peer:connect', (peer) => this._handleEventPeerConnect(node, peer))
    node.on('peer:disconnect', (peer) => this._handleEventPeerDisconnect(peer))
  }

  _registerMessageHandlers (node: Bundle) {
    node.handle(`${PROTOCOL_PREFIX}/newblock`, (protocol, conn) => this._handleMessageNewBlock(protocol, conn))
    node.handle(`${PROTOCOL_PREFIX}/status`, (protocol, conn) => this._handleMessageStatus(node, protocol, conn))
  }
}
