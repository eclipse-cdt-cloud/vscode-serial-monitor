//@ts-check
'use strict';

const path = require('path');

/** @typedef {import('webpack').Configuration} WebpackConfig **/
/** @type WebpackConfig */
const common = {
    mode: 'development',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    externals: {
        vscode: 'commonjs vscode',
        '@serialport/bindings-cpp': 'commonjs @serialport/bindings-cpp',
        'applicationinsights-native-metrics': 'commonjs applicationinsights-native-metrics'
    }
};

/** @type WebpackConfig[] */
module.exports = [
    {
        ...common,
        target: 'node',
        entry: {
            extension: './src/desktop/extension.ts'
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist', 'desktop'),
            libraryTarget: 'commonjs'
        },
    },
    {
        ...common,
        target: 'webworker',
        entry: {
            extension: './src/browser/extension.ts'
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist', 'browser'),
            libraryTarget: 'commonjs'
        }
    }
];
