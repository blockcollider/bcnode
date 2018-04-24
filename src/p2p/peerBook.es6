/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const PeerBook = require('peer-book')
const PeerInfo = require('peer-info')

const logging = require('../logger')

export class BcPeerBook extends PeerBook {
  _logger: Object // eslint-disable-line no-undef

  constructor () {
    super()

    this._logger = logging.getLogger(__filename)
    this._logger.debug('Creating BcPeerBook')
  }

  getAllArray () {
    const res = super.getAllArray()
    return res
  }

  put (peerInfo: PeerInfo, replace: boolean = null): PeerInfo {
    this._logger.debug('BcPeerBook.put()')

    const res = super.put(peerInfo, replace)
    res.status = peerInfo.status
    return res
  }
}
