/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Logger } from 'winston'

const Book = require('peer-book')
const PeerInfo = require('peer-info')

const logging = require('../logger')

/**
 * PeerBook with extensions
 */
export class PeerBook extends Book {
  _logger: Logger // eslint-disable-line no-undef

  constructor () {
    super()

    this._logger = logging.getLogger(__filename)
    this._logger.debug('Creating BcPeerBook')
  }

  /**
   * Get set of peers as an array
   * @return {*}
   */
  getAllArray () {
    return super.getAllArray()
  }

  /**
   * Add peer to book
   * @param peerInfo
   * @param replace
   * @return {PeerInfo}
   */
  put (peerInfo: PeerInfo, replace: null | boolean = null): PeerInfo {
    const peerId = peerInfo.id.toB58String()
    const oldPeer = this._peers[peerId]

    const res = super.put(peerInfo, replace)

    if (oldPeer) {
      res.meta = peerInfo.meta || oldPeer.meta
    }

    return res
  }

  getPeersCount (): number {
    return Object.keys(this._peers).length
  }
}
