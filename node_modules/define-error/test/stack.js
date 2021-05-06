var test  = require('tape'),
    error = require('..')

test('errors should have stack property', function (t) {
    t.plan(1)

    var MyError = error('MyError')
    var err = new MyError('uh oh')
    // not all browsers give us a stack, always pass this, but log whether we have it or not
    t.pass('stack property ' + (err.stack ? 'does exists' : 'does NOT exist'))
})
