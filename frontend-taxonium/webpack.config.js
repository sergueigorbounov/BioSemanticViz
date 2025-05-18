const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: ['./src/toPropertyKeyPolyfill.js', './src/index.js'],
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      publicPath: '/'
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      port: 3002,
      hot: true,
      historyApiFallback: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
      }
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules\/(?!(taxonium-component)\/).*/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
              plugins: ['@babel/plugin-transform-runtime']
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        'react': path.resolve('./node_modules/react'),
        'react-dom': path.resolve('./node_modules/react-dom'),
      },
      fallback: {
        "path": false,
        "fs": false,
        "os": false
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html'
      }),
      new webpack.ProvidePlugin({
        toPropertyKey: [path.resolve(__dirname, 'src/toPropertyKeyPolyfill.js'), 'toPropertyKey']
      })
    ],
    devtool: isProduction ? 'source-map' : 'eval-source-map'
  };
}; 