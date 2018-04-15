import React from 'react'
import ReactDOM from 'react-dom'
// import { merge, concat, take } from 'ramda'

import App from './components/App'

const appEl = document.getElementById('app')
if (appEl) {
  ReactDOM.render(<App />, appEl)
} else {
  console.error('Cannot find element with id "app"')
}
