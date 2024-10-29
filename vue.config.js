module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/RascaroBingo/' : '/',
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'RascaroBingo';
      return args;
    })
  }
};
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  publicPath: '/',
  transpileDependencies: true,
  outputDir: 'dist'
})