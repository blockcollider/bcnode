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
import { actions } from '../reducers/miner/actions'

import { PeersMap } from '../components'

export class MapContainer extends Component<*> {
  render () {
    const size = {
      height: this.props.window.size.height - 70,
      width: this.props.window.size.width
    }

    return (
      <div>
        <Helmet>
          <title>Map</title>
        </Helmet>

        <PeersMap size={size} peer={this.props.me} peers={this.props.peers} />
      </div>
    )
  }
}

function mapDispatchToProps (dispatch) {
  return { actions: bindActionCreators(actions(dispatch), dispatch) }
}

export const Map = connect(
  state => ({
    window: state.app.window,
    me: state.map.me,
    peers: state.map.peers
  }),
  mapDispatchToProps
)(MapContainer)

export default Map
