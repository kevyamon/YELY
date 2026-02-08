// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix pour react-async-hook dans react-native-country-picker-modal
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-async-hook') {
    return {
      filePath: require.resolve('react-async-hook'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;