module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/RascaroBingo/' : '/',
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'RascoBingo';
      return args;
    })
  }
};