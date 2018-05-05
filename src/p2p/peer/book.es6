/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Logger } from 'winston'
import type { PeerManager } from '../manager/manager'

const debug = require('debug')('bcnode:p2p:book')
const Book = require('peer-book')
const PeerInfo = require('peer-info')

const logging = require('../../logger')

const getPeerId = (peerInfo: PeerInfo): string => {
  return (peerInfo && peerInfo.id && peerInfo.id.toB58String()) || '<null>'
}

/**
 * PeerBook with extensions
 */
export class PeerBook extends Book {
  _logger: Logger // eslint-disable-line no-undef
  _manager: PeerManager // eslint-disable-line no-undef

  constructor (manager: PeerManager) {
    super()

    this._logger = logging.getLogger(__filename)
    this._manager = manager
    this._logger.debug('Creating BcPeerBook')
  }

  getAll (): Object {
    debug('getAllArray')

    return super.getAll()
  }
  /**
   * Get set of peers as an array
   * @return {*}
   */
  getAllArray (): Object {
    debug('getAllArray')

    return super.getAllArray()
  }

  getMultiaddrs (peerInfo: PeerInfo): Object {
    const peerId = getPeerId(peerInfo)
    debug('getMultiaddrs', peerId)

    return super.getMultiaddrs(peerInfo)
  }

  has (peerInfo: PeerInfo): PeerInfo {
    const peerId = getPeerId(peerInfo)
    debug('has', peerId)

    return super.has(peerInfo)
  }

  /**
   * Add peer to book
   * @param peerInfo
   * @param replace
   * @return {PeerInfo}
   */
  put (peerInfo: PeerInfo, replace: null | boolean = null): PeerInfo {
    const peerId = getPeerId(peerInfo)
    debug('put', peerId, replace)

    // console.log(peerInfo)

    const oldPeer = this._peers[peerId]
    const res = super.put(peerInfo, replace)

    if (oldPeer) {
      res.meta = peerInfo.meta || oldPeer.meta
    }

    return res
  }

  get (peerInfo: PeerInfo): PeerInfo {
    const peerId = getPeerId(peerInfo)
    debug('get', peerId)

    return super.get(peerInfo)
  }

  remove (peerInfo: PeerInfo): PeerInfo {
    const peerId = getPeerId(peerInfo)
    debug('remove', peerId)

    return super.remove(peerInfo)
  }

  getPeersCount (): number {
    return Object.keys(this._peers).length
  }
}
