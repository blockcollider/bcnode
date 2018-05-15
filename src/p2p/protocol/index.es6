/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { register: registerNewBlock } = require('./newBlock')
const { register: registerStatus } = require('./status')

export const register = () => {
  console.log('Registering protocols')

  registerNewBlock()

  registerStatus()
}
