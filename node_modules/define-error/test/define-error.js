var test  = require('tape'),
    error = require('..')

test('define-error is a function', function (t) {
    t.equal(typeof error, 'function', 'defineError is a function')
    t.end()
})

test('define-error returns a constructor', function (t) {
    var MyError = error('MyError')
    t.equal(typeof MyError, 'function', 'MyError is a function')
    t.end()
})
