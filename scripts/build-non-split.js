// Disables code splitting into chunks
// See https://github.com/facebook/create-react-app/issues/5306#issuecomment-433425838

const rewire = require('rewire');
const defaults = rewire('react-scripts/scripts/build.js');
let config = defaults.__get__('config');

config.output = {
    ...config.output,
    filename: 'static/js/[name].js',
    chunkFilename: 'static/js/[name].chunk.js',
};

const miniCssExtractPlugin = config.plugins.find(plugin => plugin.constructor.name === 'MiniCssExtractPlugin');
if (miniCssExtractPlugin) {
    miniCssExtractPlugin.options.filename = 'static/css/[name].css';
    miniCssExtractPlugin.options.chunkFilename = 'static/css/[name].chunk.css';
}

config.optimization.splitChunks = {
    cacheGroups: {
        default: false,
    },
};

config.optimization.runtimeChunk = false;
