var assert            = require('assert'),
    DatabaseError     = require('./errors').DatabaseError,
    HttpResponseError = require('./errors').HttpResponseError

function query () {
    throw new DatabaseError('No database to query silly')
}

function request () {
    throw new HttpResponseError('Nobody out there', 404)
}

try {
    query()
}
catch (err) {
    assert(err instanceof DatabaseError)
    assert(err instanceof Error)
    console.error(err)
}

try {
    request()
}
catch (err) {
    assert(err instanceof HttpResponseError)
    assert(!(err instanceof DatabaseError))
    assert(err instanceof Error)
    assert(err.code)
    console.error(err)
}
