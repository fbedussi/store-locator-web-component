const path = require('path');

module.exports = {
    mode: "production",
    entry: "./index",
    output: {
        path: path.resolve(__dirname, "dist"), // string
        filename: "bundle.js", // string    // the filename template for entry chunks
    },
    performance: {
        hints: "warning", // enum    maxAssetSize: 200000, // int (in bytes),
        maxEntrypointSize: 400000, // int (in bytes)
        assetFilter: function (assetFilename) {
            // Function predicate that provides asset filenames
            return assetFilename.endsWith('.css') || assetFilename.endsWith('.js');
        }
    },
    devtool: "source-map", // enum  // enhance debugging by adding meta info for the browser devtools
    // source-map most detailed at the expense of build speed.
    context: __dirname, // string (absolute path!)
    // the home directory for webpack
    // the entry and module.rules.loader option
    //   is resolved relative to this directory
    target: "web", // enum  // the environment in which the bundle should run
    // changes chunk loading behavior and available modules
    serve: { //object
        port: 1337,
        content: './dist',
        // ...
    },
    // lets you provide options for webpack-serve
    stats: "errors-only",  // lets you precisely control what bundle information gets displayed
    devServer: {
        proxy: { // proxy URLs to backend development server
            '/api': 'http://localhost:3000'
        },
        contentBase: path.join(__dirname, 'public'), // boolean | string | array, static file location
        compress: true, // enable gzip compression
        historyApiFallback: true, // true for index.html upon 404, object for multiple paths
        hot: true, // hot module replacement. Depends on HotModuleReplacementPlugin
        https: false, // true for self-signed, object for cert authority
        noInfo: true, // only errors & warns on hot reload
        // ...
    },
}