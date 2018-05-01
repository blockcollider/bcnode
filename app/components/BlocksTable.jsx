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
          <td>{block.difficulty}</td>
          <td>{block.distance}</td>
          <td>{block.nonce}</td>
          <td>{moment(block.timestamp).format('HH:mm:ss')}</td>
        </tr>
      )
    })

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
