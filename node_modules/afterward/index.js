var setImmediate = require('timers').setImmediate,
    UnknownError = require('./errors').UnknownError

module.exports = function afterward (done, cb) {
    cb = typeof cb === 'function' ? cb : function () {}
    done.then(function (value) {
        setImmediate(cb, null, value)
    })
    done.catch(function (err) {
        setImmediate(cb, err || new UnknownError('Unknown error'))
    })
    return done
}
