/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
class Address {
  assert (t: string, addr: string) {
    if (addr === undefined || t === undefined) {
      return false
    }
    if (addr.slice(0, 2) !== '0x') {
      addr = '0x' + addr
    }
    if (t === 'keccak40' || t === 'ethereum' || t === 'eth') {
      return (/^(0x){1}[0-9a-fA-F]{40}$/i.test(addr))
    }
    return false
  }
}
export default new Address()
