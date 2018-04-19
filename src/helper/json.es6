/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const fs = require('fs')

export function objFromFileSync (path: string): Object {
  return JSON.parse(fs.readFileSync(path, 'utf8'))
}

export function objToFile (path: string, obj: Object, replacer: ?(k: string, v: Object) => Object = null, space: number = 2) {
  const json = JSON.stringify(obj, replacer, space)
  fs.writeFile(path, json, () => {})
}
