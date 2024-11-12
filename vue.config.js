const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  publicPath: '/', 
  transpileDependencies: true,
  outputDir: 'dist',
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'RascaroBingo';
      return args;
    })
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        secure: false
      }
    }
  }
});