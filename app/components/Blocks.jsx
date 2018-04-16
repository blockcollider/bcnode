/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import React, { Component } from 'react'
import { take } from 'ramda'

import Block from './Block'

export default class App extends Component<*> {
  render () {
    const blocks = take(20, [] // this.props.blocks
      .sort((a, b) => b.timestamp - a.timestamp))
      .map(block => {
        return <Block {...block} block={block} key={block.data.hash} />
      })

    return (
      <div className='d-flex flex-wrap flex-row'>
        <h2 className='col-md-12 text-center' style={{marginTop: '20px', marginBottom: '20px'}}>Collected blocks (last 20)</h2>
        {blocks}
      </div>
    )
  }
}
