/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'

import Navbar from './Navbar'

export default class App extends Component<*> {
  render () {
    const {children} = this.props
    let elements = React.Children.map(children,
      (child) => {
        return React.cloneElement(child)
      })

    return (
      <div>
        <Navbar />
        <div className='container-fluid'>
          <div className='container'>
            {elements}
          </div>
        </div>
      </div>
    )
  }
}
