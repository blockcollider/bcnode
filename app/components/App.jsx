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
import Navbar from '../components/Navbar'

export class App extends Component<*> {
  render () {
    const {children} = this.props
    let elements = React.Children.map(children,
      (child) => {
        return React.cloneElement(child)
      })

    return (
      <div>
        <Helmet titleTemplate='BLOCK COLLIDER: %s'>
          <title>App</title>
        </Helmet>

        <Navbar />
        {elements}
      </div>
    )
  }
}

export default App
