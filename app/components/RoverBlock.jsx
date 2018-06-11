/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react'

const inspectBlock = (block) => {
  console.log('inspectBlock', block)
}

export class RoverBlock extends Component<*> {
  render () {
    const { blockchain, hash } = this.props.block

    return (
      <div className='card' style={{width: '8.4rem'}} onClick={() => inspectBlock(this.props.block)}>
        <img className='card-img-top' style={{ alignSelf: 'center', width: '6rem', height: '6rem', marginTop: '0.6em' }} src={getBlockIcon(blockchain)} alt={blockchain} />
        <div className='card-body'>
          <p className='card-text'>
            <small title={hash}>{formatHash(blockchain, hash)}&hellip;</small>
          </p>
          <a href={getBlockLink(blockchain, hash)} target='_blank' className='btn btn-sm'>View block</a>
        </div>
      </div>
    )
  }
}

const formatHash = (blockchain, hash) => {
  let final
  final = (blockchain === 'btc') ? hash.replace(/^0+/, '') : hash
  final = final.slice(0, 10)
  return final
}
const getBlockLink = (blockchain, hash) => {
  switch (blockchain) {
    case 'btc':
      return `https://blockchair.com/bitcoin/block/${hash}`
    case 'eth':
      return `https://etherscan.io/block/${hash}`
    case 'lsk':
      return `https://explorer.lisk.io/block/${hash}`
    case 'wav':
      return `https://wavesexplorer.com/blocks/s/${hash}`
    case 'neo':
      return `https://neotracker.io/search/${hash.slice(2)}`
    default:
      throw new Error('Unkown blockchain')
  }
}

const getBlockIcon = (blockchain: string) => {
  switch (blockchain) {
    case 'btc':
      return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAwIiBoZWlnaHQ9IjI1MDAiIHZpZXdCb3g9IjAuMDA0IDAgNjMuOTkzIDY0Ij48cGF0aCBkPSJNNjMuMDQgMzkuNzQxYy00LjI3NCAxNy4xNDMtMjEuNjM4IDI3LjU3NS0zOC43ODMgMjMuMzAxQzcuMTIgNTguNzY4LTMuMzEzIDQxLjQwNC45NjIgMjQuMjYyIDUuMjM0IDcuMTE3IDIyLjU5Ny0zLjMxNyAzOS43MzcuOTU3YzE3LjE0NCA0LjI3NCAyNy41NzYgMjEuNjQgMjMuMzAyIDM4Ljc4NHoiIGZpbGw9IiNmNzkzMWEiLz48cGF0aCBkPSJNNDYuMTEgMjcuNDQxYy42MzYtNC4yNTgtMi42MDYtNi41NDctNy4wMzktOC4wNzRsMS40MzgtNS43NjgtMy41MTItLjg3NS0xLjQgNS42MTZjLS45MjItLjIzLTEuODctLjQ0Ny0yLjgxMi0uNjYybDEuNDEtNS42NTMtMy41MDktLjg3NS0xLjQzOSA1Ljc2NmMtLjc2NC0uMTc0LTEuNTE0LS4zNDYtMi4yNDItLjUyN2wuMDA0LS4wMTgtNC44NDItMS4yMDktLjkzNCAzLjc1czIuNjA1LjU5NyAyLjU1LjYzNGMxLjQyMi4zNTUgMS42OCAxLjI5NiAxLjYzNiAyLjA0MmwtMS42MzggNi41NzFjLjA5OC4wMjUuMjI1LjA2MS4zNjUuMTE3bC0uMzctLjA5Mi0yLjI5NyA5LjIwNWMtLjE3NC40MzItLjYxNSAxLjA4LTEuNjA5LjgzNC4wMzUuMDUxLTIuNTUyLS42MzctMi41NTItLjYzN2wtMS43NDMgNC4wMiA0LjU3IDEuMTM5Yy44NS4yMTMgMS42ODMuNDM2IDIuNTAyLjY0NmwtMS40NTMgNS44MzUgMy41MDcuODc1IDEuNDQtNS43NzJjLjk1Ny4yNiAxLjg4Ny41IDIuNzk3LjcyNkwyNy41MDQgNTAuOGwzLjUxMS44NzUgMS40NTMtNS44MjNjNS45ODcgMS4xMzMgMTAuNDkuNjc2IDEyLjM4My00LjczOCAxLjUyNy00LjM2LS4wNzUtNi44NzUtMy4yMjUtOC41MTYgMi4yOTQtLjUzMSA0LjAyMi0yLjA0IDQuNDgzLTUuMTU3ek0zOC4wODcgMzguNjljLTEuMDg2IDQuMzYtOC40MjYgMi4wMDQtMTAuODA3IDEuNDEybDEuOTI4LTcuNzI5YzIuMzguNTk0IDEwLjAxMSAxLjc3IDguODggNi4zMTd6bTEuMDg1LTExLjMxMmMtLjk5IDMuOTY2LTcuMSAxLjk1MS05LjA4MyAxLjQ1N2wxLjc0OC03LjAxYzEuOTgzLjQ5NCA4LjM2NyAxLjQxNiA3LjMzNSA1LjU1M3oiIGZpbGw9IiNmZmYiLz48L3N2Zz4='
    case 'eth':
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUzNSIgaGVpZ2h0PSIyNTAwIiB2aWV3Qm94PSIwIDAgMjU2IDQxNyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCI+PHBhdGggZmlsbD0iIzM0MzQzNCIgZD0iTTEyNy45NjEgMGwtMi43OTUgOS41djI3NS42NjhsMi43OTUgMi43OSAxMjcuOTYyLTc1LjYzOHoiLz48cGF0aCBmaWxsPSIjOEM4QzhDIiBkPSJNMTI3Ljk2MiAwTDAgMjEyLjMybDEyNy45NjIgNzUuNjM5VjE1NC4xNTh6Ii8+PHBhdGggZmlsbD0iIzNDM0MzQiIgZD0iTTEyNy45NjEgMzEyLjE4N2wtMS41NzUgMS45MnY5OC4xOTlsMS41NzUgNC42TDI1NiAyMzYuNTg3eiIvPjxwYXRoIGZpbGw9IiM4QzhDOEMiIGQ9Ik0xMjcuOTYyIDQxNi45MDV2LTEwNC43MkwwIDIzNi41ODV6Ii8+PHBhdGggZmlsbD0iIzE0MTQxNCIgZD0iTTEyNy45NjEgMjg3Ljk1OGwxMjcuOTYtNzUuNjM3LTEyNy45Ni01OC4xNjJ6Ii8+PHBhdGggZmlsbD0iIzM5MzkzOSIgZD0iTTAgMjEyLjMybDEyNy45NiA3NS42Mzh2LTEzMy44eiIvPjwvc3ZnPg=='
    case 'lsk':
      return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjcwLjM1IDIwMDAiIHdpZHRoPSIyNTAwIiBoZWlnaHQ9IjI1MDAiPjxnIGZpbGw9IiMxYTY4OTYiPjxwYXRoIGQ9Ik05MzMuMTkgMzkzLjkybC0xNC4yMyAxMDkuMTIgODEuNjcgNjguNDMgMTQ1LjcxLTUxLjA4LTk3LjcxLTgxLjA5LTQ4Ljk1LTkzLjExTDczOC40MiA5Ni41bDY5LjY5IDE3Ny4yMiAxMjUuMDggMTIwLjIiLz48cGF0aCBkPSJNNzQ0LjE4IDQ1MC43NGwtMTYuMTYgOTYuODktMTg0LjIgMTMyLjI1IDE4LjE0IDIxNS4zMiAxMzkuMzkgMzU0Ljk3IDc4Ljk2LTE0Mi45LTI1LjYxLTM5LjU4IDc2LjAyLTE4My45MnYtOTQuMDFsMTQ0LjU5LTE5Ny4zNC05MC42OC03NS45OCAxNC40Mi0xMTAuNTMtMTE4LjQzLTExMy43OUw2ODAuNTEgMzkuODdsLTcuMDYtMy44NC45NiAyMzQuMjkgNjkuNzcgMTgwLjQyIi8+PHBhdGggZD0iTTExMTEuOSAxMDg3LjUybDE0LjMyLTI1LjA4di0xODkuOGwzMi44MS0zMjIuNDUtMTUxLjY2IDUzLjE1LTE0NC4zMyAxOTYuOTl2ODkuODNsLTcxLjk5IDE3NC4yMSAxNy4yNiAyNi42OSAyNzkuNjggMTkuNjQgMjMuOTEtMjMuMThNNjYzLjA0IDE1MzYuMzhsNDQuMTggMjEuNDcgMzMuNDItMzcgOTcuODktMTQuMzQgMzcuMDEtNTAuMTQgODMuNTYtMi4zNyA0Ljc4LTI1LjA4IDgyLjM1LTE1LjUgMjQuNzktMjcxLjUyLTI2Mi43My0xOC40NS05NC43MSAxNzEuMzYtOTIuMjYgMjQ5LjIxIDkuNSA0Ni4wNyAzMi4yMi01My43MU00MzguNDggMTE0Ny4wN2wtMjQ1LjAyIDEwNy42NyA2LjQxIDE1NC4yOSAxMDMuODYgNTIuMTMgMjUuMDYgNDEuNzggNTIuNTMtMjcuNDYgMzEuMDMgOS41NSA5LjU2LTI1LjA1IDIxLjQ5LTguMzcgNjYuODUgMjYuMjcgMjUuMDYgNjIuMDggNTMuNzItMjUuMDhoOC42Mmw4My45MS0yMjYuNjYtMTM3LjM3LTM0OS44Ny0xMDUuNzEgMjA4LjcyIi8+PHBhdGggZD0iTTE1NC41MSAxMTYxLjUzbDIwLjQ5IDY2LjAzIDIzOS44OC0xMDUuNDMgMTE0LjY5LTIyNi40NS0xNy44MS0yMTEuNThMNTcuNzMgNTM1LjA1bDEwNS4xNCA1NDYuNDktOC4zNiA3OS45OU02OTguMzQgNTI5LjE2bDEyLjUxLTc1LjAxLTY4LjcyLTE3Ny43Mkw2NDAuOTkgMWwtMjAuOTEtMUw1OTUgMTEuOTQgNjcuNyA1MDQuMzFsNDU2LjUgMTQ5Ljg3IDE3NC4xNC0xMjUuMDJ6TTExOTAuNjQgMTM4MGwtOTEuOTQtNDMuNTktNi4yNSA2OC41NyAyNy43OSAxMy4xOC0xMTYuNTYgNzkuODQtMTI5LjU4IDEwMy41OUw3MzcuMTggMTYzN2wtMTExLjA3IDU4LjQtMTM4LjgzLTUxLjM0LTI0OC40LTE0MS4zNi0xMDQuNTUtODUuMjEgMjAuMy03LjUxLTIuODItNjcuODYtODcgMzIuMTMtNjQuODUgMTIyLjY2IDExIDIxNS4yIDEzNCA1Ny42NCAyMC45OCAxNi4yNSAyNzYuMDcgMTM1IDIzLjA4IDMuNDggMTMxLjY1IDcyLjQ2IDY4Ljg1IDMuMTMgOTAuNy00Ny45NSAyODQuNjUtMTM0LjU3IDIxMi42Mi0xMTYuNjMgMTYuOC0xODguODZtLTY0My43OCAzNTcuNDh2NjRsLTExLjg2LS41NC0xMjguNTQtNzAuNzktMjQuNjctMy43Mi0yNjEuMS0xMjcuNjMtMjIuMTMtMTcuMjEtMTA0LjctNDUtOC4wNi0xNTcuMjYgNDAtNzUuNjkgMTE1IDkzLjc5IDI1MS44NiAxNDMuMzIgMTQxLjE5IDUyLjQ0IDI3LjY0IDExMS42NW01NTEuMDQtMTc2LjEybC0xNzkuOCA5OC42OC0yODQuNDIgMTM0LjQ3LTY5LjEyIDM2LjUxdi01NGwxNi4zOC0zNi41My0yOS4zMy0xMTguNDggMTAyLjkyLTU0LjExIDE0MC0zNi4yMSAxMzMuNTQtMTA2LjgzIDEyNy4yNC04Ny4xMSA1NC40NiA5MC4xNCIvPjwvZz48L3N2Zz4='
    case 'wav':
      return 'data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNTI3LjQgNTI3LjQiIHdpZHRoPSIyNTAwIiBoZWlnaHQ9IjI1MDAiPjxzdHlsZT4uc3Qwe2ZpbGw6IzA1Zn08L3N0eWxlPjxwYXRoIHRyYW5zZm9ybT0icm90YXRlKC00NS4wMDEgMjYzLjY5IDI2My42OTYpIiBjbGFzcz0ic3QwIiBkPSJNNzcuMiA3Ny4yaDM3Mi45djM3Mi45SDc3LjJ6Ii8+PC9zdmc+'
    case 'neo':
      return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjkyLjMxIDIwMDAiIHdpZHRoPSIyNTAwIiBoZWlnaHQ9IjI1MDAiPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iYSIgeDE9IjE5MS41OSIgeTE9IjE3MTIuMDQiIHgyPSIxNDE5LjM0IiB5Mj0iNjYyLjI2IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agc3RvcC1jb2xvcj0iI2JlZWEyZSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzUyYmEwMCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxwYXRoIGQ9Ik0xNTMuODUgMzgwLjA5bDY2OS42OCAzMTYuNzRWMjAwMGwtNjY5LjY4LTMxNi43NFYzODAuMDl6TTExNjcuNDIgMEwxODYgMzQ4Ljk0bDY2My42OCAzMTguNzQgOTc4LjM4LTM1MC45NHptLTE4LjEgNTk2LjI5djc5Ny4zOGw2OTYuODMgMjcxLjQ5VjM0NS44OXoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xNTMuODUpIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+'
    default:
      throw new Error('Unkown blockchain')
  }
}

export default RoverBlock
