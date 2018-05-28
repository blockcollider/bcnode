/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const { inspect } = require('util')

const { RxPubSub } = require('rx-pubsub')
const debug = require('debug')('bcnode:engine:pubsub')

export class PubSub {
  _subscribers: Object; // eslint-disable-line no-undef

  constructor () {
    this._subscribers = {}
  }
  subscribe (topic: string, context:string, listener: Function) {
    if (!topic) {
      throw new Error('No topic to subscribe specified')
    }

    if (!context) {
      throw new Error('No subscribe context specified')
    }

    if (!listener) {
      throw new Error('No pubsub listener specified')
    }

    debug('Subscribing to topic', topic, context)
    if (!this._subscribers[topic]) {
      this._subscribers[topic] = {
        stats: {
          count: 0
        },
        subscribers: []
      }
    }

    const subscriber = RxPubSub.subscribe(topic, listener)
    this._subscribers[topic].subscribers.push({ subscriber, context })
    this._subscribers[topic].stats.count++
    return subscriber
  }

  publish (topic: string, data: any) {
    debug('Publishing new message', inspect(topic), data)
    RxPubSub.publish(topic, data)
  }
}

export default PubSub
