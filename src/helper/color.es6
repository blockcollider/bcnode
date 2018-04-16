/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const colors = require('colors')

export function getColor (tag: string) {
  switch (tag) {
    case 'wav': {
      return colors.bgCyan(tag)
    }

    case 'lsk': {
      return colors.bgRed(tag)
    }

    case 'eth': {
      return colors.bgMagenta(tag)
    }

    case 'btc': {
      return colors.bgYellow(tag)
    }

    case 'neo': {
      return colors.bgGreen(tag)
    }
  }
}
