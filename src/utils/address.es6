/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
class Address {
  constructor () {
    this.types = ["keccak40", "ethereum", "eth"] 
  }
  assert (type, addr) {
    if (addr === undefined || type === undefined || this.types.indexOf(type) < 0) {
      return false 
    }
    if (addr.slice(0,2) !== "0x") {
      addr = "0x" + addr 
    }
    if(type === "keccak40" || type === "ethereum" || type == "eth") {
      return (/^(0x){1}[0-9a-fA-F]{40}$/i.test(addr));
    }
    return false
  }
}
export default new Address()
