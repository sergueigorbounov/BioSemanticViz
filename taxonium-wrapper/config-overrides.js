const path = require('path');
const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add string-replace-loader for taxonium-component
  config.module.rules.push({
    test: /[\\/]node_modules[\\/]taxonium-component[\\/].*\.js$/,
    use: {
      loader: 'string-replace-loader',
      options: {
        search: /\?\?/g,
        replace: ' || ',
      },
    },
  });

  // For webpack 4, we need to use ProvidePlugin instead of resolve.fallback
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
    })
  );

  return config;
}; 