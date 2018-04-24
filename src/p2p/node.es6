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
const waterfall = require('async/waterfall')
const pull = require('pull-stream')

const Engine = require('../engine').default
const logging = require('../logger')
const { BcBlock } = require('../protos/core_pb')
const Bundle = require('./bundle').default
const { BcPeerBook } = require('./peerBook')
const Signaling = require('./signaling').websocket
const { getVersion } = require('../helper/version')

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
  _peers: BcPeerBook // eslint-disable-line no-undef
  _node: Bundle // eslint-disable-line no-undef

  constructor (engine: Engine) {
    this._engine = engine
    this._logger = logging.getLogger(__filename)
    this._statusMsg = {
      networkId: NETWORK_ID,
      peerId: null,
      protocolVersion: PROTOCOL_PREFIX,
      version: getVersion()
    }
    this._peers = new BcPeerBook()
  }

  get node (): Bundle {
    return this._node
  }

  start () {
    const pipeline = [
      (cb) => PeerInfo.create(cb),
      (peerInfo, cb) => {
        this._logger.info(`Staring p2p node with ${peerInfo.id.toB58String()}`)

        peerInfo.multiaddrs.add(Signaling.getAddress(peerInfo))

        const opts = {
          signaling: Signaling
        }
        this._node = new Bundle(peerInfo, this._peers, opts)
        this._node.start(cb)

        this._registerMessageHandlers()
      }
    ]

    waterfall(pipeline, (err) => {
      if (err) {
        this._logger.error(err)
        throw err
      }

      this._registerEventHandlers()
    })

    return true
  }

  broadcastNewBlock (method: string, block: BcBlock) {
    this._logger.debug(`Broadcasting msg to peers, ${inspect(block.toObject())}`)

    const url = `${PROTOCOL_PREFIX}/${method}`
    this._peers.getAllArray().map(peer => {
      this._logger.debug(`Sending to peer ${peer}`)
      this._node.dialProtocol(peer, url, (err, conn) => {
        if (err) {
          this._logger.error('Error sending message to peer', peer, err)
        }

        pull(pull.values([block.serializeBinary()]), conn)
      })
    })
  }

  _handleEventPeerConnect (peer: Object) {
    this._logger.debug('Connection established:', peer.id.toB58String())
    this._node.dialProtocol(peer, `${PROTOCOL_PREFIX}/status`, (err, conn) => {
      if (err) {
        this._node.hangUp(peer, () => {
          this._logger.error(`${peer.id.toB58String()} disconnected, reason: ${err.message}`)
        })
      }
      const msg = this._statusMsg
      msg.peerId = peer.id.toB58String()
      pull(pull.values([JSON.stringify(msg)]), conn)
    })
  }

  _handleEventPeerDisconnect (peer: Object) {
    try {
      this._peers.remove(peer)
      this._logger.info(`Peer ${peer.id.toB58String()} disconnected, removed from book`)
      this._engine._emitter.emit('peerDisconnected', { peer })
    } catch (e) {
      this._logger.warn(`Unable to remove peer from peer book, reason: ${e.message}`)
    }
  }

  _handleEventPeerDiscovery (peer: Object) {
    this._logger.info(`Discovered: ${peer.id.toB58String()}`)
    this._node.dial(peer, (err) => {
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

  _handleMessageStatus (protocol: Object, conn: Object) {
    pull(
      conn,
      pull.collect((err, wireData) => {
        if (err) {
          this._logger.warn('Error while processing status')
          return
        }

        let statusData = {}

        try {
          statusData = JSON.parse(wireData.toString())
          const { networkId, peerId } = statusData
          if (networkId !== NETWORK_ID) {
            this._logger.warn(`Disconnecting peer ${peerId} - network id mismatch ${networkId} / ${NETWORK_ID}`)
            this._node.hangUp(new PeerId(peerId), () => {
              this._logger.debug(`${peerId} disconnected`)
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

          statusData.connectedAt = Date.now()
          peer.status = statusData
          this._peers.put(peer)
          const peerId = peer.id.toB58String()
          this._logger.info(`Status handled successfully, added peer ${peerId}`)
          this._engine._emitter.emit('peerConnected', { peer })
        })
      })
    )
  }

  _registerEventHandlers () {
    this._node.on('peer:discovery', (peer) => this._handleEventPeerDiscovery(peer))
    this._node.on('peer:connect', (peer) => this._handleEventPeerConnect(peer))
    this._node.on('peer:disconnect', (peer) => this._handleEventPeerDisconnect(peer))
  }

  _registerMessageHandlers () {
    this._node.handle(`${PROTOCOL_PREFIX}/newblock`, (protocol, conn) => this._handleMessageNewBlock(protocol, conn))
    this._node.handle(`${PROTOCOL_PREFIX}/status`, (protocol, conn) => this._handleMessageStatus(protocol, conn))
  }
}
