const path = require('path');
const slsw = require('serverless-webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const TerserPlugin = require('terser-webpack-plugin');

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    externalsPresets: {
        node: true,
    },
    entry: slsw.lib.entries,
    mode: 'production',
    // externals: [
    //     nodeExternals(),
    //     {
    //         'aws-sdk': 'commonjs2 aws-sdk',
    //     },
    // ],
    node: false,
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
        plugins: [new TsconfigPathsPlugin()],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'ts-loader',
                exclude: [
                    [
                        path.resolve(__dirname, '.webpack'),
                        path.resolve(__dirname, '.serverless'),
                    ],
                ],
                options: {
                    transpileOnly: true,
                    experimentalFileCaching: true,
                },
            },
        ],
    },
    output: {
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, '.webpack'),
        filename: '[name].js',
    },

    optimization: {
        minimize: false,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    mangle: true,
                    keep_classnames: true,
                    keep_fnames: false,
                },
            }),
        ],
    },
    plugins: [new ForkTsCheckerWebpackPlugin(), new BundleAnalyzerPlugin()],
};
