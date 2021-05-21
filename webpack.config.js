const path = require('path');
var nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'development',
  entry: './public/client.js',
  output: {
    path: path.resolve(__dirname, 'views'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.js'],
  },
  target: 'node',
  externals: [nodeExternals()]
};

