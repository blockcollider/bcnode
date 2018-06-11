/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'
import { merge } from 'ramda'

export class Dot extends Component<*> {
  render () {
    const defaultSize = 25
    const style = {
      height: this.props.size || defaultSize,
      width: this.props.size || defaultSize,
      backgroundColor: this.props.color, // '#b00',
      borderRadius: '50%',
      display: 'inline-block'
    }

    return (
      <span style={merge(style, this.props.style || {})} />
    )
  }
}

export default Dot
