var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: './apps/blocks/src/app.jsx',

  output: {
    path: path.resolve(__dirname, 'apps', 'blocks', 'js'),
    filename: 'app-blocks.bundle.js'
  },

  module: {
    loaders: [
      {
        test: /\.jsx$/,
        loader: 'babel-loader'
      }
    ]
  },

  stats: {
    colors: true
  },

  devtool: 'source-map'
}
