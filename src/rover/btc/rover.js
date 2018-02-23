```
/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
 ```

const { Hub } = require('iris')
const logging = require('../../logger')
const Controller = require('./controller').default

const main = () => {
  const hub = new Hub()
  process.title = 'bc-rover-btc'
  const controller = new Controller(logging.logger, hub)
  controller.init()
}

main()
