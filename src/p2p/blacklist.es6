/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const PeerInfo = require('peer-info')

const config = require('../../config/config')
const logging = require('../logger')
const { PeerBook } = require('./book')
const Node = require('./node').default

export const REASON_LIST = [
  {
    id: 'PROTOCOL_OLD_VERSION',
    message: 'Old version of protocol'
  }
]

export const REASON_LOOKUP = REASON_LIST
  .reduce((acc, el) => {
    acc[el.id] = el
    return acc
  }, {})

export const REASON = REASON_LIST
  .reduce((acc, el) => {
    acc[el.id] = el.id
    return acc
  }, {})

const INTERVAL_SEC = (
  config.p2p &&
  config.p2p.blacklist &&
  config.p2p.blacklist.purgeInterval &&
  config.p2p.blacklist.purgeInterval * 1000
) || 5 * 60 * 1000 // Once per five minutes

/**
 * Blacklist
 *
 * Uses BcPeerBook internally
 */
export class Blacklist {
  _logger: Object // eslint-disable-line no-undef
  _node: Node // eslint-disable-line no-undef
  _interval: IntervalID // eslint-disable-line no-undef
  _peers: PeerBook // eslint-disable-line no-undef

  /**
   * Creates new instance of blacklist
   * @param node node handling blacklisted peers
   */
  constructor (node: Node) {
    this._node = node
    this._peers = new PeerBook()

    this._logger = logging.getLogger(__filename)
    this._logger.info('Initializing p2p blacklist')

    this._interval = setInterval(() => this._purge(), INTERVAL_SEC)
  }

  /**
   * Get list of blacklisted peers
   * @return {BcPeerBook}
   */
  get peers () : PeerBook {
    return this._peers
  }

  /**
   * Add peer to list of blacklisted users
   * @param peer peer to be blacklisted
   * @param reasonId reason for blacklisting
   * @param opts extra opts
   */
  add (peer: PeerInfo, reasonId: string, opts: Object = {}) {
    const peerId = peer.id.toB58String()
    if (!reasonId) {
      this._logger.error(`Invalid blacklist reason specified - peer ${peerId}, reason: ${reasonId}`)
      return console.trace()
    }

    const reason = REASON_LOOKUP[reasonId]
    const reasonMsg = reason.message || '<not-specified>'
    this._logger.info(`Blacklisting peer ${peerId}, reason ${reasonId} - ${reasonMsg}`)

    let blacklistedPeer
    if (this._peers.has(peer)) {
      this._logger.info('Peer already blacklisted', peerId)
      blacklistedPeer = this._peers.get(peer)
    } else {
      blacklistedPeer = peer
      // const now = Date.now()
      // blacklistedPeer.blacklist = {
      //   ts: {
      //     created: now,
      //     updated: now
      //   },
      //   reasons: [
      //     reasonId
      //   ]
      // }
    }

    this._peers.put(blacklistedPeer)
  }

  /**
   * Remove user from blacklist
   * @param peer
   */
  remove (peer: PeerInfo) {
    if (this._peers.has(peer)) {
      this._peers.remove(peer)
    }
  }

  /**
   * Check if is user blacklisted
   * @param peer
   */
  isBlacklisted (peer: PeerInfo): boolean {
    return this._peers.has(peer)
  }

  /**
   * Purge list of blacklisted users if needed
   * @private
   */
  _purge () {
    this._logger.info('Purging blacklist')
  }
}
