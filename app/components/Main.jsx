/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import React, { Component } from 'react'

import {
  Route,
  Switch
} from 'react-router-dom'

import Blocks from './Blocks'

export default class Main extends Component<*> {
  render () {
    return (
      <main>
        <Switch>
          <Route exact path='/' component={Blocks} />
        </Switch>
      </main>
    )
  }
}
