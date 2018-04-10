var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: './app/src/app.jsx',

  output: {
    path: path.resolve(__dirname, 'dist', 'js'),
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
