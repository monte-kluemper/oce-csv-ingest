var afterward = require('..'),
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
