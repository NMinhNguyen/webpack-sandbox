var webpack = require('webpack');
var memoryFs = require('./memoryFs');
var path = require('path');
var utils = require('./utils');
var createLoaders = require('./createLoaders');
var fs = require('fs')

module.exports = {
  create: function (session) {
    if (!utils.getEntry(session.files)) {
      return Promise.resolve(null);
    }

    return (
        utils.sessionHasPackages(session) ? utils.getManifest(session.packages) : Promise.resolve(null)
      )
      .then(function (manifest) {
        return new Promise(function (resolve, reject) {
          var compiler = webpack({
            devtool: 'cheap-source-map',
            entry: {
              app: path.join('/', 'app', session.id, utils.getEntry(session.files))
            },
            output: {
              path: path.join('/', 'app', session.id),
              filename: 'bundle.js'
            },
            resolveLoader: {
              modules: [path.resolve('node_modules'), path.join('/', 'node_modules')]
            },
            resolve: {
              extensions: ['.ts', '.tsx', '.js', '.jsx'],
              modules: [path.resolve('node_modules'), path.join('/', 'node_modules')]
            },
            module: {
              loaders: createLoaders(session.loaders, require.resolve.bind(require))
            },
            plugins: manifest ? [
              new webpack.DllReferencePlugin({
                context: '/',
                manifest: manifest
              })
            ] : [],
            externals: manifest ? manifest.externals : []
          });

          compiler.inputFileSystem = memoryFs.fs;
          compiler.outputFileSystem = memoryFs.fs;
          compiler.resolvers.normal.fileSystem = memoryFs.fs;
          compiler.resolvers.context.fileSystem = memoryFs.fs;

          resolve(compiler);
        });
      });
  }
};
