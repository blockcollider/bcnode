/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// const R = require('ramda')

// const { zip } = require("rambda")
// const similarity = require('compute-cosine-similarity')
// const _ = require('lodash')
// const { blake2bl } = require('../../utils/crypto')
//
// const blake = black2bl

function getExpFactorDiff (calculatedDifficulty, parentBlockHeight) {
  let periodCount = (parentBlockHeight + 1) / 66000000
  if (periodCount > 2) {
    return calculatedDifficulty + (2 ^ (periodCount - 2))
  }

  return calculatedDifficulty
}
