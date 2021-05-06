# afterward

[![NPM version](https://badge.fury.io/js/afterward.png)](http://badge.fury.io/js/afterward)
[![Build Status](https://travis-ci.org/jasonpincin/afterward.svg?branch=master)](https://travis-ci.org/jasonpincin/afterward)
[![Coverage Status](https://coveralls.io/repos/jasonpincin/afterward/badge.png?branch=master)](https://coveralls.io/r/jasonpincin/afterward?branch=master)
[![Sauce Test Status](https://saucelabs.com/browser-matrix/jp-afterward.svg)](https://saucelabs.com/u/jp-afterward)

Execute an error-first callback upon resolution or rejection of a promise, and return the promise.

This makes it easier to write functions that support both callback and promise based async patterns.

## example

```javascript
var afterward = require('afterward'),
    Promise   = require('promise-polyfill')

function greet (name, cb) {
    var prom = new Promise(function (resolve) {
        setTimeout(resolve.bind(undefined, 'greetings ' + name), 100)
    })
    return afterward(prom, cb)
}

// we can now use our fancy function either way...
// with a callback:
greet('jason', function (err, msg) {
    if (err) return console.error(err)
    console.log(msg)
})

// or a promise
greet('gege').then(console.log).catch(console.error)
```

## api

```javascript
var afterward = require('afterward')
```

### prom = afterward(prom [, cb])

Upon resolution or rejection of the promise `prom`, execute the optional error-first style callback `cb`. The promise `prom` is returned.

### errors

```javascript
var UnknownError = require('afterward/errors').UnknownError
```

#### UnknownError

The constructor function of the `Error` object provided to callback `cb` when the Promise `prom` is rejected with no argument.

## testing

`npm test [--dot | --spec] [--phantom] [--grep=pattern]`

Specifying `--dot` or `--spec` will change the output from the default TAP style. 
Specifying `--phantom` will cause the tests to run in the headless phantom browser instead of node.
Specifying `--grep` will only run the test files that match the given pattern.

### browser test

`npm run browser-test`

This will run the tests in all browsers (specified in .zuul.yml). Be sure to [educate zuul](https://github.com/defunctzombie/zuul/wiki/cloud-testing#2-educate-zuul) first.

### coverage

`npm run coverage [--html]`

This will output a textual coverage report. Including `--html` will also open 
an HTML coverage report in the default browser.
