var test      = require('tape'),
    afterward = require('..'),
    Promise   = require('promise-polyfill')

Function.prototype.bind = Function.prototype.bind || require('function-bind') // eslint-disable-line no-extend-native

test('afterward', function (t) {
    t.plan(11)

    var p1 = Promise.resolve('hi')
    afterward(p1, function (err, data) {
        t.false(err, 'err is falsey on resolution')
        t.equal(data, 'hi', 'should invoke cb with resolved data')
    })
    t.doesNotThrow(function () {
        afterward(p1, {})
    }, 'does not throw when 2nd arg is not a function')

    var p2 = Promise.reject()
    afterward(p2, function (err, data) {
        t.true(err, 'err is truthy on reject(null)')
        t.false(data, 'should invoke cb with no data on reject')
    })

    var p3 = Promise.reject(new Error('test'))
    afterward(p3, function (err, data) {
        t.equal(err.message, 'test', 'err.message is known on reject(err)')
        t.false(data, 'should invoke cb with no data on reject')
    })

    var p4a = new Promise(function (resolve) {
        setTimeout(function () {
            resolve('hi')
        }, 100)
    })
    var p4b = afterward(p4a, function (err, msg) {
        t.false(err)
        t.equal(msg, 'hi', 'executes callback after async op')
    })
    t.equal(p4a, p4b, 'returns promise given')
    p4b.then(function (data) {
        t.equal(data, 'hi', 'resolves returned promise')
    })
})
