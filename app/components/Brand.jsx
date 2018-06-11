/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'

// $FlowFixMermreser
import VERSION from '../../.version.json'

const STYLE = {
  height: '35px',
  width: '35px',
  padding: 0
}

const FIELD_STYLE = {
  marginLeft: '10px',
  color: 'black'
}

const linkGithub = `https://github.com/blockcollider/bcnode/tree/${VERSION.git.short}`

export class Brand extends Component<*> {
  render () {
    return (
      <div className='navbar-brand'>
        <a href='https://blockcollider.org'>
          <img src='/img/bc-black.png' style={STYLE} />
        </a>
        <a href='/#/' style={FIELD_STYLE}>
          Block Collider
        </a>
        <a style={FIELD_STYLE} href={linkGithub}>
          ({VERSION.npm}/{VERSION.git.short})
        </a>

        {this.props.children}
      </div>
    )
  }
}

export default Brand
