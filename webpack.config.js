const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        scan: './src/js/scan.js',
        select: './src/js/select.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].js'
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
            template: './src/scan.html',
            filename: 'scan.html',
            chunks: ['scan']
        }),
        new HtmlWebpackPlugin({
            inject: false,
            template: './src/select.html',
            filename: 'index.html',
            chunks: ['select']
        })
    ]
}