const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions if needed
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg');

// Add Node.js polyfills for web environment
config.resolver.alias = {
  ...config.resolver.alias,
  // Polyfill Node.js modules for web
  'process': require.resolve('process/browser'),
  'util': require.resolve('util'),
  'stream': require.resolve('stream-browserify'),
  'buffer': require.resolve('buffer'),
};

// Configure resolver to handle Node.js modules in web environment
config.resolver.platforms = ['native', 'web', 'default'];

// Enable web-specific settings
// Note: Removed custom port - let Expo use default 8081
// config.server = {
//   port: 8083,
// };

module.exports = withNativeWind(config, { input: './global.css' });
