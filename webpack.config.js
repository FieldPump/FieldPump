// FieldPump Webpack Configuration

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './client/src/index.ts',
    output: {
      path: path.resolve(__dirname, 'client/dist'),
      filename: 'bundle.js',
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './client/index.html',
        filename: 'index.html'
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'client/dist')
      },
      compress: true,
      port: 8080,
      hot: true,
      proxy: {
        '/api': 'http://localhost:3000',
        '/ws': {
          target: 'ws://localhost:9000',
          ws: true
        }
      }
    },
    devtool: isProduction ? 'source-map' : 'inline-source-map'
  };
};