/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Bundle } from '../bundle'
import type { PeerManager } from '../manager/manager'

const { register: registerNewBlock } = require('./newBlock')
const { register: registerStatus } = require('./status')

export const registerProtocols = (manager: PeerManager, bundle: Bundle) => {
  console.log('Registering protocols')

  registerNewBlock(manager, bundle)

  registerStatus(manager, bundle)
}
