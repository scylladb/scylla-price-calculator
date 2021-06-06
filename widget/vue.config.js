const sha = require('child_process').execSync('git rev-parse HEAD').toString().trim()
process.env.VUE_APP_VERSION = sha

module.exports = {
    configureWebpack: {
        devtool: 'source-map'
    }
}