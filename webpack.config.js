const path = require('path');
var nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'development',
  entry: './server.js',
  output: {
    path: path.resolve(__dirname, 'views'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.js'],
  },
  module: {
    rules: [
      {
        exclude: /node_modules/
      }
    ]
  }
};

