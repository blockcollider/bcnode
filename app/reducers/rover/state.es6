/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import CircularBuffer from 'circular-buffer'

export const initialState = {
  count: 0,
  blocks: new CircularBuffer(24)
}
