const path = require('path');
const { merge } = require('webpack-merge');

const commonWebpackConfig = require('./webpack.common.config');

module.exports = (env = {}) =>
  merge(commonWebpackConfig(env), {
    mode: 'development',
    devServer: {
      compress: true,
      host: '127.0.0.1',
      port: 4173,
      static: {
        directory: path.resolve(__dirname, 'tests/browser'),
      },
    },
    devtool: 'source-map',
  });
