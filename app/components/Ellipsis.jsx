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

export const ellipsisLeft = (text: string, length: number, ellipsis: string): string => {
  const tl = text.length
  if (tl <= length) {
    return text
  }

  const el = ellipsis.length
  if (tl <= el) {
    return text
  }

  const sl = length - el
  const right = text.slice(-sl)
  return `${ellipsis}${right}`
}

export const ellipsisRight = (text: string, length: number, ellipsis: string): string => {
  const tl = text.length
  if (tl <= length) {
    return text
  }

  const el = ellipsis.length
  if (tl <= el) {
    return text
  }

  const sl = length - el
  const left = text.slice(0, sl)
  return `${left}${ellipsis}`
}

/**
 * Formats using ellipsis in middle
 * @param text Text to format
 * @param length Length of output (formatted) text
 * @param ellipsis Ellipsis text
 * @return {string} Formatted string
 */
export const ellipsisMiddle = (text: string, length: number, ellipsis: string): string => {
  const tl = text.length
  if (tl <= length) {
    return text
  }

  const el = ellipsis.length
  if (tl <= el) {
    return text
  }

  const sl = length - el
  const pl = Math.ceil(sl / 2)
  const left = text.slice(0, pl)
  const right = text.slice(-(length - el - pl))
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
    length: 12,
    type: 'middle'
  }

  static propTypes = {
    ellipsis: PropTypes.string,
    text: PropTypes.string,
    length: PropTypes.number,
    type: PropTypes.oneOf(['left', 'middle', 'right'])
  }

  render () {
    return (
      <span style={STYLE} data-toggle='tooltip' data-placement='top' title={this.props.text} >
        {ellipsisMiddle(this.props.text, this.props.length, this.props.ellipsis)}
      </span>
    )
  }
}

export default Ellipsis
