/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const debug = require('debug')('bcnode:p2p:manager')

const { BcPeerBook } = require('./peer/book')

export class PeerManager {
  _peerBook: BcPeerBook // eslint-disable-line no-undef

  constructor () {
    debug('constructor()')
    this._peerBook = new BcPeerBook()
  }

  get peerBook (): BcPeerBook {
    return this._peerBook
  }
}
