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

import { BlocksTable } from '../components'
import { actions } from '../reducers/blocks/actions'

export class BlocksContainer extends Component<*> {
  _fetchBlocks (id: String, blocks: Object[], action: Function) {
    if (!blocks ||
       blocks.length < 1 ||
       id === 'latest' ||
       id !== String(blocks[0].id)
    ) {
      action(id)
    }
  }

  componentDidMount () {
    this._fetchBlocks(this.props.id, this.props.blocks, this.props.actions.getBlocks)
  }

  componentWillReceiveProps (nextProps: Object) {
    if (this.props.id !== nextProps.id) {
      this._fetchBlocks(nextProps.id, nextProps.blocks,
        this.props.actions.getBlocks)
    }
  }

  render () {
    const getLink = (id: number) => `/blocks/${id}`

    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>Blocks</title>
        </Helmet>
        <h2 className='col-md-12 text-center' style={{marginTop: '16px', marginBottom: '16px'}}>
          Blocks
        </h2>
        <BlocksTable blocks={this.props.blocks} onClick={this.props.actions.showBlock} />

        { this.props.blocks[0] && <nav aria-label='Blocks pagination'>
          <ul className='pagination justify-content-end'>
            <li className='page-item'>
              <a className='page-link'
                href={'/#' + getLink(this.props.blocks[0].height + this.props.perPage)}>Newer</a>
            </li>
            <li className='page-item'>
              <a className='page-link'
                href={'/#' + getLink(this.props.blocks[0].height - this.props.perPage)}>Older</a>
            </li>
          </ul>
        </nav>}
      </div>
    )
  }
}

function mapDispatchToProps (dispatch, ownProps) {
  return {
    actions: bindActionCreators(actions(dispatch), dispatch)
  }
}

const Blocks = connect(
  (state, ownProps) => {
    const id = ownProps.match.params.id || 'latest'
    let blocks = state.blocks.stored.blocks
    let perPage = state.blocks.stored.perPage
    return {
      id,
      perPage,
      blocks
    }
  },
  mapDispatchToProps
)(BlocksContainer)

export default Blocks
