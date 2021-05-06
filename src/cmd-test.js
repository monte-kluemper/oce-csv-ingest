#!/usr/bin/env node

const asyncrun = async () => {
  console.log('async')
}
const run = () => {
  console.log('sync')
}

if (require.main === module) {
  ;(async () => {
    const program = require('commander')

    program
      .command('foo')
      .description('Foo It')
      .action(run)
    program
      .command('afoo')
      .description('Foo It')
      .action(asyncrun)

    program.on('command:*', function () {
      console.error('Invalid command: %s\n', program.args.join(' '))
      program.help()
      process.exit(1)
    })
    await program.parse(process.argv)
    // if not command is found, print help
    if (process.argv.length === 2) {
      // e.g. display usage
      program.help()
    }
  })().catch(console.error)
}
