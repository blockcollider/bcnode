/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'
import { round } from 'mathjs'
import moment from 'moment'

import { VersionLink } from './VersionLink'

const PeerLink = (props: Object) => {
  const peer = props.peer
  const linkProps = {
    href: `/#/peer/${peer.id}`,
    onClick: (e) => {
      e.preventDefault()
      props.onClick(peer)
    },
    style: {
      color: 'black'
    }
  }
  return (
    <a {...linkProps}>{props.children}</a>
  )
}

const UNITS = [
  'B',
  'kB',
  'MB',
  'GB',
  'TB'
]

const UNITS_PS = [
  'Bps',
  'kBps',
  'MBps',
  'GBps',
  'TBps'
]

const formatBytes = (bytes: number, units: string[] = UNITS, precision: number = 0) => {
  let i
  let res = bytes
  for (i = 0; i < (units.length - 1) && res >= 1024; i++) {
    res /= 1024
  }

  return `${round(res, precision)}${units[i]}`
}

export class PeersTable extends Component<*> {
  render () {
    let id = 0

    const now = Date.now()
    const peers = this.props.peers.map((peer) => {
      const peerId = `${peer.id.substring(0, 6)}...${peer.id.substr(peer.id.length - 6)}`

      const meta = peer.meta || {}
      const metaVersion = meta.version || {}

      // const address = (peer.addrs || [])
      //   .map((addr) => {
      //     const key = `${peer.id}.${addr}`
      //     return (
      //       <div key={key}>{addr.substring(0, 34)}</div>
      //     )
      //   })

      const address = (
          <div>{peerId}</div>
      )

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

      const stats = () => {
        const snapshot = peer.stats && peer.stats.snapshot
        if (!snapshot) {
          return 'N/A'
        }

        const timeDiff = (now - peer.meta.ts.connectedAt) * 0.001
        const total = `${formatBytes(snapshot.dataReceived, UNITS, 2)}/${formatBytes(snapshot.dataSent, UNITS, 2)}`
        const speed = `${formatBytes(snapshot.dataReceived / timeDiff, UNITS_PS, 2)}/${formatBytes(snapshot.dataSent / timeDiff, UNITS_PS, 2)}`

        return (
          <div>
            <div key={`${peer.id}.stats.total`}>{total}</div>
            <div key={`${peer.id}.stats.speed`}>{speed}</div>
          </div>
        )
      }

      return (
        <tr key={peer.id}>
          <th scope='row'>{id++}</th>
          <td>
            <PeerLink peer={peer} onClick={this.props.onClick}>{peerId}</PeerLink>
          </td>
          <td>{address}</td>
          <td>{protocolVersion}</td>
          <td><VersionLink version={metaVersion} /></td>
          <td>{stats()}</td>
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
              <th scope='col'>RX/TX</th>
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
