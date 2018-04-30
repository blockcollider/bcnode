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

export default class App extends Component<*> {
  render () {
    const {children} = this.props
    let elements = React.Children.map(children,
      (child) => {
        return React.cloneElement(child)
      })

    return (
      <div>
        <Helmet titleTemplate='Block Colider: %s'>
          <title>App</title>
          <link rel='stylesheet' href='https://use.fontawesome.com/releases/v5.0.10/css/all.css' />
        </Helmet>

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
