import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter } from 'react-router-dom'

import App from './components/App'

const appEl = document.getElementById('app')
if (appEl) {
  ReactDOM.render((
    <HashRouter>
      <App />
    </HashRouter>
  ), appEl)
} else {
  console.error('Cannot find element with id "app"')
}
