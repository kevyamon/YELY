// babel.config.js
module.exports = function(api) {
  api.cache(true);
  
  const plugins = [];

  // Nettoyage intelligent en production : on supprime les logs inutiles (info, log, debug)
  // MAIS on conserve imperativement 'error' et 'warn' pour que Sentry puisse capturer les crashs.
  if (process.env.NODE_ENV === 'production' || process.env.BABEL_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  // ATTENTION : Le plugin reanimated DOIT ABSOLUMENT etre le dernier de la liste.
  // Ne jamais rien push apres cette ligne.
  plugins.push('react-native-reanimated/plugin');

  return {
    presets: ['babel-preset-expo'],
    plugins: plugins,
  };
};