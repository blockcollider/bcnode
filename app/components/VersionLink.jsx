/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'

export class VersionLink extends Component<*> {
  render () {
    const style = {
      marginLeft: '10px',
      color: 'black'
    }

    const version = this.props.version

    const gitVersion = (
      version.git &&
      version.git.short
    ) || '<unknown>'

    const npmVersion = (
      version.npm
    ) || '<unknown>'

    const linkGithub = `https://github.com/blockcollider/bcnode/tree/${gitVersion}`
    const text = `${npmVersion}/${gitVersion}`
    return (
      <a style={style} href={linkGithub}>{text}</a>
    )
  }
}

export default VersionLink
