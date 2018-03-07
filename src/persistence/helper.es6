/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * Serializes value into Buffer
 *
 * @param val Value to be serialized
 */
export function serialize (val: Object): Buffer {
  return Buffer.from([])
}

/**
 * Deserializes Buffer into appropriate value (with proper type)
 *
 * @param val Value to be deserialized
 * @return {{}}
 */
export function deserialize (val: Buffer): Object {
  return {}
}
