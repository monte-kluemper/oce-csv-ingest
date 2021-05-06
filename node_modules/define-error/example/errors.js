var defineError = require('..')

module.exports.DatabaseError = defineError('DatabaseError')

module.exports.HttpResponseError = defineError('HttpResponseError', function (message, code) {
    this.code = code
})
