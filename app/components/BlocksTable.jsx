/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'
import moment from 'moment'

import { Ellipsis } from '../components'

const BlockLink = (props: Object) => {
  const block = props.block
  const linkProps = {
    href: `/#/block/${block.height}`,
    onClick: (e) => {
      e.preventDefault()
      props.onClick(block)
    },
    style: {
      color: 'black'
    }
  }
  return (
    <a {...linkProps}>{props.children}</a>
  )
}

class BlocksTable extends Component<*> {
  render () {
    let i = 0
    const blocks = this.props.blocks.map((block) => {
      const extraFields = (this.props.extraCols || []).map((colName, idx) => (<td key={idx}>{block[colName[1]]}</td>))

      const fixedStyle = {
        fontFamily: 'monospace'
      }
      return (
        <tr key={block.hash}>
          <th scope='row'>{i++}</th>
          <td>
            <BlockLink block={block} onClick={this.props.onClick}>{block.height}</BlockLink>
          </td>
          <td>
            <BlockLink block={block} onClick={this.props.onClick}>
              <Ellipsis text={block.hash} />
            </BlockLink>
          </td>
          <td style={fixedStyle}>{block.difficulty}</td>
          <td style={fixedStyle}>{block.distance}</td>
          <td>{block.nonce}</td>
          {extraFields}
          <td>{moment(block.timestamp * 1000).format('HH:mm:ss')}</td>
        </tr>
      )
    })

    const extraHeaders = (this.props.extraCols || []).map((colName, idx) => (<th key={idx} scope='col'>{colName[0]}</th>))

    return (
      <div className='table-responsive'>
        <table className='table table-light table-striped '>
          <thead className='thead-light'>
            <tr>
              <th scope='col'>#</th>
              <th scope='col'>Height</th>
              <th scope='col'>Hash</th>
              <th scope='col'>Difficulty</th>
              <th scope='col'>Distance</th>
              <th scope='col'>Nonce</th>
              {extraHeaders}
              <th scope='col'>Timestamp</th>
            </tr>
          </thead>
          <tbody>{blocks}</tbody>
        </table>
      </div>
    )
  }
}

export default BlocksTable
