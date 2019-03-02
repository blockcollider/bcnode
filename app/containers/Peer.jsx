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
import { push } from 'react-router-redux'
import { find, propEq } from 'ramda'

export class PeerContainer extends Component<*> {
  _conditionalRedirect () {
    if (!this.props.peer || (this.props.peer.id !== this.props.id)) {
      this.props.dispatch(push('/peers'))
    }
  }

  componentDidMount () {
    this._conditionalRedirect()
  }

  componentWillReceiveProps (nextProps: Object) {
    this._conditionalRedirect()
  }

  render () {
    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>PEER</title>
        </Helmet>

        <h2 className='col-md-12 text-center' style={{marginTop: '16px', marginBottom: '9px'}}>
          PEER
        </h2>
      </div>
    )
  }
}

export const Peer = connect(
  (state) => {
    const id = state.peer.id
    let peer = state.peer.peer
    if (id && (peer === null || peer.id !== id)) {
      peer = find(propEq('id', id), state.peers.peers || [])
    }

    return {
      id,
      peer
    }
  }
)(PeerContainer)

export default Peer
