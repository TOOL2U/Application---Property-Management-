/**
 * Webpack Configuration for Web Environment
 * Handles Node.js polyfills and module resolution
 */

const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add Node.js polyfills
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "process": require.resolve("process/browser"),
    "util": require.resolve("util"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
    "path": require.resolve("path-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "crypto": require.resolve("crypto-browserify"),
    "fs": false,
    "net": false,
    "tls": false,
    "child_process": false,
  };

  // Add plugins for global polyfills
  const webpack = require('webpack');
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    })
  );

  // Define global variables for web environment
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.stdout.isTTY': JSON.stringify(false),
      'process.stderr.isTTY': JSON.stringify(false),
      'process.stdin.isTTY': JSON.stringify(false),
      'global': 'globalThis',
    })
  );

  return config;
};
