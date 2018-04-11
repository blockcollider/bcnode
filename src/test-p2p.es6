/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { Node } = require('./p2p')
const logging = require('./logger')
const logger: Object  = logging.getLogger(__filename)

const engine = {}
const node = new Node(engine)
const res = node.start()

logger.info(`Node started, res: ${JSON.stringify(res)}`)
