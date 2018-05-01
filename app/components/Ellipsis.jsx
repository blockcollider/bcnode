/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'
import PropTypes from 'prop-types'

const formatText = (text: string, length: number, ellipsis: string): string => {
  const left = text.slice(0, length / 2)
  const right = text.slice(-length / 2)
  return `${left}${ellipsis}${right}`
}

const STYLE = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}

export class Ellipsis extends Component<*> {
  static defaultProps = {
    ellipsis: '...',
    text: '',
    length: 12
  }

  static propTypes = {
    ellipsis: PropTypes.string,
    text: PropTypes.string,
    length: PropTypes.number
  }

  render () {
    return (
      <span style={STYLE}>
        {formatText(this.props.text, this.props.length, this.props.ellipsis)}
      </span>
    )
  }
}

export default Ellipsis
