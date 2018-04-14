/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * Converts error to object which can be serialized to JSON
 *
 * {
 *   "stack": [
 *     "Error: Could not deserialize value",
 *      "at db.get (/Users/korczis/dev/bcnode/lib/persistence/rocksdb.js:106:25)"
 *   ],
 *   "message": "Could not deserialize value"
 * }
 *
 * @param err Error to be converted
 * @return {{}}
 */
export function errToObj(err: Error) {
  const props = Object.getOwnPropertyNames(err)

  const obj = props.reduce((acc, val) => {
    // $FlowFixMe
    acc[val] = err[val]
    return acc
  }, {})

  obj.stack = obj.stack
    .split("\n")
    .map((line) => line.trim())

  return obj
}
