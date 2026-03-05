// metro.config.js
// CONFIGURATION METRO - Fusion Fix CountryPicker & Sentry Source Maps

const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// 1. On initialise la configuration avec Sentry (qui inclut déjà la configuration Expo par défaut)
const config = getSentryExpoConfig(__dirname);

// 2. On applique ton fix pour react-async-hook (react-native-country-picker-modal)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-async-hook') {
    return {
      filePath: require.resolve('react-async-hook'),
      type: 'sourceFile',
    };
  }
  // Fallback vers le resolver standard pour le reste
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;