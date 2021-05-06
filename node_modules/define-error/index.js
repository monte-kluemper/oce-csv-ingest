var inherits          = require('util').inherits,
    captureStackTrace = require('capture-stack-trace')

module.exports = function defineError (name, init) {
    name = typeof name === 'string' ? name : 'UndefinedError'
    init = typeof init === 'function' ? init : function () {}

    function ErrorCtor (message) {
        captureStackTrace(this, ErrorCtor)
        this.message = message
        init.apply(this, arguments)
    }
    inherits(ErrorCtor, Error)
    ErrorCtor.prototype.name = name

    return ErrorCtor
}
