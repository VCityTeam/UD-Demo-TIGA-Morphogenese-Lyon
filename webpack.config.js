/** @format */
const path = require('path');
const mode = process.env.NODE_ENV;
const debugBuild = mode === 'development';
const HtmlWebpackPlugin = require('html-webpack-plugin');

let outputPath;
if (debugBuild) {
  outputPath = path.resolve(__dirname, 'dist/debug');
} else {
  outputPath = path.resolve(__dirname, 'dist/release');
}

module.exports = (env) => {
  const rules = [
    {
      // We also want to (web)pack the style files:
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    },
    {
      test: /\.json$/,
      include: [path.resolve(__dirname, 'src')],
      loader: 'raw-loader',
    },
    {
      test: /\.html$/,
      use: [
        {
          loader: 'html-loader',
          options: { minimize: !debugBuild },
        },
      ],
    },
  ];
 
  const plugins = [
    new HtmlWebpackPlugin({
      template: "./home.html",
      chunks: ['home']
    }),
    new HtmlWebpackPlugin({
      // template: "./index.html",
      title: 'Demo debug',
      filename: 'index.html',
      // chunks: ['bootstrap']
    }),
  ];

  const config = {
    mode,
    entry: {
      // main: './src/home.js',
      index: [path.resolve(__dirname, './src/bootstrap.js')],
      main: './src/home.js'
    },
    output: {
      path: outputPath,
      filename: 'app_name.js',
      library: 'app_name',
      libraryTarget: 'umd',
      umdNamedDefine: true,
    },
    module: {
      rules: rules,
    },
    devServer: {
      port: 8000,
      hot: true,
    },
    plugins: plugins,
  };

  if (debugBuild) config.devtool = 'source-map';

  return config;
};
