const path = require('path');
const BomPlugin = require('webpack-utf8-bom');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        main: './src/js/scan.js'
    },
    node: {
        fs: 'empty'
    },
    devtool: 'source-map',
    devServer: {
        watchContentBase: true,
        overlay: true
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/scan.js'
    },
    module: {
        rules: [{
            test: /\.(ts|tsx)$/,
            use: 'ts-loader'
        }]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin([
            { from: "src/css", to: "css" },
            //{ from: "src/js/deps", to: "js/deps" }
        ]),
        new BomPlugin(true),
        new HtmlWebpackPlugin({
            inject: false,
            template: './src/index.html',
            filename: 'index.html'
        })
    ]
}