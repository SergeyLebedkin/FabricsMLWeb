const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        main: './src/js/scan.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/scan.js'
    },
    node: {
        fs: 'empty' // need for tiff.js
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    devtool: 'source-map',
    devServer: {
        watchContentBase: true,
        overlay: true
    },
    module: {
        rules: [{
            test: /\.(ts|tsx)$/,
            use: 'ts-loader'
        }, {
            test: /\.js$/,
            loader: 'ify-loader'
        }]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin([
            { from: "src/css", to: "css" },
            //{ from: "src/js/deps", to: "js/deps" }
        ]),
        new HtmlWebpackPlugin({
            inject: false,
            template: './src/index.html',
            filename: 'index.html'
        })
    ]
}