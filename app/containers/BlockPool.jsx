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

export class BlockPool extends Component<*> {
  render () {
    return (
      <div className='d-flex flex-wrap flex-row'>
        <Helmet>
          <title>Block Pool</title>
        </Helmet>

        <h2 className='col-md-12 text-center' style={{marginTop: '16px', marginBottom: '9px'}}>
          Block Pool
        </h2>
      </div>
    )
  }
}

export default BlockPool
