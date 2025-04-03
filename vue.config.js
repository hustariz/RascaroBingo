module.exports = {
  publicPath: '/', 
  transpileDependencies: [],
  outputDir: 'dist',
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'RascaroBingo';
      return args;
    });
    
    config.plugin('define').tap(args => {
      args[0].__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = JSON.stringify(true);
      return args;
    });
  },
  configureWebpack: {
    resolve: {
      fallback: {
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
        zlib: require.resolve('browserify-zlib')
      }
    }
  },
  devServer: {
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        secure: false
      }
    }
  }
}
