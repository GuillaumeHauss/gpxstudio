const path = require('path');

module.exports = {
  entry: './frontend/include/node/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'frontend/include/node'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  mode: 'production',
};
