/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { evolve } from 'ramda'

import { actions } from '../reducers/block/actions'
import { internalToHuman, COIN_FRACS } from '../../lib/core/coin'

export class BlockContainer extends Component<*> {
  _fetchBlock (id: String) {
    if (!this.props.block || (id !== String(this.props.block.height))) {
      this.props.actions.getBlock(id)
    }
  }
  componentDidMount () {
    this._fetchBlock(this.props.id)
  }

  componentWillReceiveProps (nextProps: Object) {
    this._fetchBlock(nextProps.id)
  }

  render () {
    const getLink = (id: number) => `/block/${id}`
    let block = false
    if (this.props.block) {
      block = this.props.block

      let formattedTxs = []
      for (let tx of block.txsList) {
        let formattedOutputs = []
        let formattedInputs = []
        for (let output of tx.outputsList) {
          formattedOutputs.push(evolve({
            value: v => internalToHuman(Buffer.from(v, 'base64'), COIN_FRACS.NRG),
            unit: u => parseInt(Buffer.from(u, 'base64').toString('hex'), 16),
            outputScript: s => Buffer.from(s, 'base64').toString('ascii')
          }, output))
        }

        for (let input of tx.inputsList) {
          formattedInputs.push(evolve({
            outPoint: {
              value: v => internalToHuman(Buffer.from(v, 'base64'), COIN_FRACS.NRG)
            },
            inputScript: s => Buffer.from(s, 'base64').toString('ascii')
          }, input))
        }
        tx.inputs = formattedInputs
        tx.outputs = formattedOutputs
        delete tx.outputsList
        delete tx.inputsList
        formattedTxs.push(tx)
      }
      delete block.txsList
      block.txs = formattedTxs
    }
    const blockJson = block && JSON.stringify(block, null, 4)

    const pagination = (
      blockJson &&
      <div>
        <nav aria-label='Blocks pagination'>
          <ul className='pagination justify-content-end'>
            <li className='page-item'>
              <a className='page-link'
                href={'/#' + getLink(this.props.block.height + 1)}>Newer</a>
            </li>
            <li className='page-item'>
              <a className='page-link'
                href={'/#' + getLink(this.props.block.height - 1)}>Older</a>
            </li>
          </ul>
        </nav>
      </div>
    )

    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>BLOCK</title>
        </Helmet>
        <h2 className='col-md-12 text-center' style={{marginTop: '16px', marginBottom: '9px'}}>BLOCK #{this.props.id}</h2>

        { pagination }

        <div className='container bg-light' style={{padding: '18px'}}>
          { blockJson &&
            <pre>
              {blockJson}
            </pre>
          }
        </div>

        { pagination }
      </div>
    )
  }
}

function mapDispatchToProps (dispatch, ownProps) {
  return {
    actions: bindActionCreators(actions, dispatch)
  }
}

export const Block = connect(
  (state, ownProps) => {
    const id = ownProps.match.params.id
    let block = state.block.block

    return {
      id,
      block
    }
  },
  mapDispatchToProps
)(BlockContainer)

export default Block
