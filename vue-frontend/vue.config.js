module.exports = {
  devServer: {
    proxy: {
      // proxy all requests starting with /api to jsonplaceholder
      '/ws/': {
        target: 'ws://localhost:80',
        secure: false,
        ws: true,
        changeOrigin: true,
      }
    }
  }
}
