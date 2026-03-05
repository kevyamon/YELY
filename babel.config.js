// babel.config.js
module.exports = function(api) {
  api.cache(true);
  
  const plugins = [
    'react-native-reanimated/plugin', // Requis si tu utilises react-native-reanimated
  ];

  // Suppression automatique des console.log en production
  if (process.env.NODE_ENV === 'production' || process.env.BABEL_ENV === 'production') {
    plugins.push('transform-remove-console');
  }

  return {
    presets: ['babel-preset-expo'],
    plugins: plugins,
  };
};