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
import { actions } from '../reducers/multiverse/actions'

import { BlocksTable } from '../components'
import { Button } from 'reactstrap'

export class MultiverseContainer extends Component<*> {
  componentDidMount () {
    this.props.actions.getMultiverse()
  }

  render () {
    const keys = Object.keys(this.props.multiverse)
    const verses = keys.map((k, idx) => {
      return (
        <div className='container' key={idx}>
          <h2 className='col-md-12 text-center' style={{marginTop: '16px', marginBottom: '9px'}}>
            MULTIVERSE {k}
          </h2>

          <BlocksTable blocks={this.props.multiverse[k]}/>
        </div>
      )
    })

    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>MULTIVERSE</title>
        </Helmet>

        <h2 className='col-md-12 text-center' style={{marginTop: '16px', marginBottom: '9px'}}>
          MULTIVERSE
        </h2>

        <div>
          <Button color='danger' onClick={() => this.props.actions.purgeMultiverse()}>Purge!</Button>
        </div>
        {verses}
      </div>
    )
  }
}

function mapDispatchToProps (dispatch, ownProps) {
  return {
    actions: bindActionCreators(actions(dispatch), dispatch)
  }
}

const Multiverse = connect(
  (state, ownProps) => {
    let multiverse = state.multiverse.multiverse
    return {
      multiverse
    }
  },
  mapDispatchToProps
)(MultiverseContainer)

export default Multiverse
