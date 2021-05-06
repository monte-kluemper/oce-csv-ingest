var test  = require('tape'),
    error = require('..')

test('instanceof works', function (t) {
    t.plan(3)

    var MyError = error('MyError')
    var MyOtherError = error('MyOtherError')
    var err = new MyError('uh oh')
    t.notOk(err instanceof MyOtherError, 'err should NOT be an instance of MyOtherError')
    t.ok(err instanceof MyError, 'err should be instanceof MyError')
    t.ok(err instanceof Error, 'err should be instanceof Error')
})
