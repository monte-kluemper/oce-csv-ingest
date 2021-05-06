var test  = require('tape'),
    error = require('..')

test('should expose given name', function (t) {
    t.plan(2)

    var MyError = error('MyError')
    var err = new MyError('uh oh')
    t.equal(err.name, 'MyError', 'err.name = MyError')
    t.equal(err.message, 'uh oh', 'err.message = uh oh')
})

test('should expose default name when none given', function (t) {
    t.plan(2)

    var UndefinedError = error()
    var err = new UndefinedError('uh oh')
    t.equal(err.name, 'UndefinedError', 'err.name = UndefinedError')
    t.equal(err.message, 'uh oh', 'err.message = uh oh')
})
