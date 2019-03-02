/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import Parser from 'html-react-parser'
import React, { Component } from 'react'

import moment from 'moment-timezone'

import { Ellipsis } from './Ellipsis'

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

  if (props.style) {
    linkProps.style = props.style
  }

  return (
    <a {...linkProps}>{props.children}</a>
  )
}

class BlocksTable extends Component<*> {
  render () {
    const blocks = this.props.blocks.map((block, idx) => {
      const extraFields = (this.props.extraCols || []).map(
        (colName, idx) => {
          const val = typeof colName[1] === 'function' ? colName[1](block) : block[colName[1]]
          return (
            <td key={idx}>{val}</td>
          )
        }
      )

      const fixedStyle = {
        fontFamily: 'monospace'
      }
      // let wrongPrevHash = false
      if (this.props.blocks[idx]) {
        const a = this.props.blocks[idx]
        // const b = this.props.blocks[idx].previousHash
        // wrongPrevHash = (a !== b)
      }
      // { wrongPrevHash && <i style={{paddingLeft: 3, filter: 'invert(100%)', color: 'red'}} className='fas fa-exclamation-circle' /> }

      // let wrongPrevHash = false
      // if (this.props.blocks[idx + 1]) {
      //   const a = this.props.blocks[idx + 1].hash
      //   const b = this.props.blocks[idx].previousHash
      //   wrongPrevHash = (a !== b)
      // }
      let table = []
      if (this.props.blocks[idx + 1]) {
        Object.keys(this.props.blocks[idx].blockchainHeaders).map((k) => {
          const c = this.props.blocks[idx + 1].blockchainHeaders[k]
          const b = this.props.blocks[idx].blockchainHeaders[k]
          const diffs = c.reduce((all, option) => {
            let store = true
            b.map((s) => {
              if (s.hash === option.hash) {
                store = false
              }
            })
            all.push(option)
            return all
          }, [])

          if (diffs.length > 0) {
            diffs.map((d) => {
              table.push({ conf: d.blockchainConfirmationsInParentCount,
                data: '<div id="' + k + '">' + d.blockchainConfirmationsInParentCount +
                         '</div>'})
            })
          } else {
            b.map((s) => {
              table.push({ conf: s.blockchainConfirmationsInParentCount,
                data: '<div id="glassList">' + s.blockchainConfirmationsInParentCount +
                       '</div>'})
            })
          }
        })
      }
      // { wrongPrevHash && <i style={{paddingLeft: 3, filter: 'invert(100%)', color: 'red'}} className='fas fa-exclamation-circle' /> }
      const sorted = table.sort((a, b) => {
        if (a.blockchainConfirmationsInParentCount > b.blockchainConfirmationsInParentCount) {
          return -1
        }
        if (a.blockchainConfirmationsInParentCount < b.blockchainConfirmationsInParentCount) {
          return 1
        }
        return 0
      })

      const oneOnly = sorted.reduce((all, b) => {
        if (b.conf > 1) {
          all.push(b.data)
        }
        return all
      }, [])

      if (oneOnly.length === 0) {
        for (let i = 0; 5 - oneOnly.length; i++) {
          oneOnly.push('')
        }
      } else {
        for (let i = 0; 5 - oneOnly.length; i++) {
          oneOnly.push('<div id="glassList">+</div>')
        }
      }

      return (
        <tr key={block.hash}>
          <th>{Parser(oneOnly.join(''))}</th>
          <td>
            <BlockLink block={block} onClick={this.props.onClick}>{block.height}</BlockLink>
          </td>
          <td>
            <BlockLink block={block} onClick={this.props.onClick} >
              <Ellipsis text={block.hash} />
            </BlockLink>
          </td>
          <td>
            <Ellipsis text={block.previousHash} />
          </td>
          <td>
            <Ellipsis text={block.miner} />
          </td>
          <td style={fixedStyle}>{block.difficulty}</td>
          <td style={fixedStyle}>{block.distance}</td>
          <td>{block.nonce}</td>
          {extraFields}
          <td title={moment(block.timestamp * 1000).tz('UTC').format()}>
            {/* <small style={{ fontSize: 'x-small' }}>{moment(block.timestamp * 1000).format('YYYY-MM-DD')}</small> */}
            {/* <br /> */}
            {moment(block.timestamp * 1000).tz(moment.tz.guess()).format('HH:mm:ss')}
          </td>
        </tr>
      )
    })

    const extraHeaders = (this.props.extraCols || []).map((colName, idx) => (<th key={idx} scope='col'>{colName[0]}</th>))

    return (
      <div className='table-responsive'>
        <table className='table table-light table-striped '>
          <thead className='thead-light'>
            <tr>
              <th scope='col'>Multichain</th>
              <th scope='col'>Height</th>
              <th scope='col'>Hash</th>
              <th scope='col'>Previous Hash</th>
              <th scope='col'>Miner</th>
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
