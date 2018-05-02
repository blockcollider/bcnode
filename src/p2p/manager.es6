/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const debug = require('debug')('bcnode:p2p:manager')

const { PeerBook } = require('./book')
const { PeerNode } = require('./node')

export class PeerManager {
  _peerBook: PeerBook // eslint-disable-line no-undef
  _peerNode: PeerNode // eslint-disable-line no-undef

  constructor (node: PeerNode) {
    debug('constructor()')
    this._peerNode = node
    this._peerBook = new PeerBook(this)
  }

  get peerBook (): PeerBook {
    return this._peerBook
  }
}
