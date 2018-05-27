/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'
import moment from 'moment'

import { VersionLink } from './VersionLink'

export class PeersTable extends Component<*> {
  render () {
    let id = 0
    const peers = this.props.peers.map((peer) => {
      const peerId = `${peer.id.substring(0, 6)}...${peer.id.substr(peer.id.length - 6)}`

      const meta = peer.meta || {}
      const metaVersion = meta.version || {}

      const address = (peer.addrs || [])
        .map((addr) => {
          const key = `${peer.id}.${addr}`
          return (
            <div key={key}>{addr.substring(0, 34)}</div>
          )
        })

      const protocolVersion = (
        metaVersion.protocol
      ) || '<unknown>'

      const startedAgo = (
        meta &&
        meta.ts &&
        meta.ts.startedAt &&
        moment(meta.ts.startedAt).fromNow()
      )

      const connectedAgo = (
        meta &&
        meta.ts &&
        meta.ts.connectedAt &&
        moment(meta.ts.connectedAt).fromNow()
      )

      const keyStartedAt = `${peer.id}.ts.startedAt`
      const keyConnectedAt = `${peer.id}.ts.connectedAt`
      const timestamp = () => {
        return (
          <div>
            <div key={keyStartedAt}>{startedAgo}</div>
            <div key={keyConnectedAt}>{connectedAgo}</div>
          </div>
        )
      }

      return (
        <tr key={peer.id}>
          <th scope='row'>{id++}</th>
          <td>{peerId}</td>
          <td>{address}</td>
          <td>{protocolVersion}</td>
          <td><VersionLink version={metaVersion} /></td>
          <td>{timestamp()}</td>
        </tr>
      )
    })

    return (
      <div className='table-responsive'>
        <table className='table table-light table-striped'>
          <thead className='thead-light'>
            <tr>
              <th scope='col'>#</th>
              <th scope='col'>ID</th>
              <th scope='col'>Address</th>
              <th scope='col'>Protocol Version</th>
              <th scope='col'>Version</th>
              <th scope='col'>Timestamp</th>
            </tr>
          </thead>
          <tbody>{peers}</tbody>
        </table>
      </div>
    )
  }
}

export default PeersTable
