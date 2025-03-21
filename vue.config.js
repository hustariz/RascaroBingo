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
