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
  Circle,
  Map,
  Polyline,
  TileLayer
} from 'react-leaflet'

import { divIcon } from 'leaflet'
import { Marker } from 'react-leaflet'

export class PeersMap extends Component<*> {
  render () {
    const zoom = 3;

    const style = {
      width: this.props.size.width,
      height: this.props.size.height,
      paddingLeft: 0,
    }

    const me = this.props.peer
    const posMe = (me && [
      me.location.latitude,
      me.location.longitude
    ]) || [40.730610, -73.935242]

    let latlon = {};
    this.props.peers.map((peer, idx) => {
      let ln = `${peer.location.latitude},${peer.location.longitude}`;
      latlon[ln] = latlon[ln] ? latlon[ln]+1 : 1;
    });

    let latlongs = Object.keys(latlon).map(ln=>{
      return {lat:ln.split(',')[0],lon:ln.split(',')[1],count:latlon[ln]};
    });

    const peerPoints = latlongs.map(({lat,lon,count},idx) => {
      let size = count > 6 ? `h12` : `h${count+5}`;
      let icon = divIcon({className: `lpi leaflet-pulsing-icon ${size}`})

      return (
        <Marker key={idx} icon={icon} position={[lat,lon]}/>
      )
    });

    const peerLines = latlongs.map(({lat,lon,count}, idx) => {
      const posPeer = [lat,lon]
      if(count > 20) count = 20;
      return (
        <Polyline key={idx} color='white' weight={count/10} positions={[posMe, posPeer]} />
      )
    })

    const icon = divIcon({className: 'lpi leaflet-pulsing-icon h6'})

    const mePoint = (<Marker icon={icon} position={posMe}/>);

    return (
      <Map
        animate={false}
        center={posMe}
        zoom={zoom}
        style={style}
        zoomControl={false}
        gridLines={false}
        minZoom={zoom - 1}
      >
        <TileLayer
          url='https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}{r}.png'
        />

        { mePoint }
        { peerPoints }
        { peerLines }
      </Map>
    )
  }
}

export default PeersMap
