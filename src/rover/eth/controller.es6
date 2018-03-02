/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const Network = require('./network').default

/**
 * ETH Controller
 */
export default class Controller {
  _dpt: boolean; // eslint-disable-line no-undef
  _interfaces: Object[]; // eslint-disable-line no-undef

  constructor () {
    this._dpt = false
    this._interfaces = []
  }

  get interfaces (): Object[] {
    return this._interfaces
  }

  start () {
    var network = new Network()

    network.connect()

    this.interfaces.push(network)
  }

  init () {
    this.start()
  }

  close () {
    this.interfaces.map((c) => {
      c.close()
    })
  }
}
