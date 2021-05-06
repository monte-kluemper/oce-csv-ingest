var test  = require('tape'),
    error = require('..')

test('init function runs when making error', function (t) {
    t.plan(4)

    var AdvancedError = error('AdvancedError', function (message, code) {
        this.code = code
    })
    var err = new AdvancedError('boom', 404)

    t.ok(err instanceof AdvancedError, 'err is instanceof AdvancedError')
    t.ok(err instanceof Error, 'err is instanceof Error')
    t.equal(err.message, 'boom', 'err has expected message')
    t.equal(err.code, 404, 'err has a code property')
})
