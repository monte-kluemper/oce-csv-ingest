# define-error

[![NPM version](https://badge.fury.io/js/define-error.png)](http://badge.fury.io/js/define-error)
[![Build Status](https://travis-ci.org/jasonpincin/define-error.svg?branch=master)](https://travis-ci.org/jasonpincin/define-error)
[![Coverage Status](https://coveralls.io/repos/jasonpincin/define-error/badge.png?branch=master)](https://coveralls.io/r/jasonpincin/define-error?branch=master)

Define errors without frills, but with stack traces and instanceof support. 

## example

First, create and expose a singleton that defines your errors such as `errors.js`:

```javascript
var defineError = require('define-error')

module.exports.DatabaseError = defineError('DatabaseError')

module.exports.HttpResponseError = defineError('HttpResponseError', function (message, code) {
    this.code = code
})
```

Then use them:

```javascript
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
```

## api

```javascript
var defineError = require('define-error')
```

### var CustomError = defineError('CustomError' [, initFunc])

Create an error constructor, `CustomError(message)`. `Error` will be in the prototype chain. If an `initFunc` function is provided, it will be called in the context of the error being created with all arguments that were passed to the error constructor. This will happen after the `message` and `stack` properties are set on the error object.

## install

With [npm](https://npmjs.org) do:

```
npm install define-error
```

## testing

`npm test [--dot | --spec] [--phantom] [--grep=pattern]`

Specifying `--dot` or `--spec` will change the output from the default TAP style. 
Specifying `--phantom` will cause the tests to run in the headless phantom browser instead of node.
Specifying `--grep` will only run the test files that match the given pattern.

### browser tests

`npm run browser-tests`

This will run the tests in all browsers (specified in .zuul.yml). Be sure to [educate zuul](https://github.com/defunctzombie/zuul/wiki/cloud-testing#2-educate-zuul) first.

### coverage

`npm run coverage [--html]`

This will output a textual coverage report. Including `--html` will also open 
an HTML coverage report in the default browser.
