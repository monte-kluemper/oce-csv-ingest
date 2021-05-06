#!/usr/bin/env node

const fetch = require('node-fetch')
const {
  readCredentials,
  readPersistedToken,
  generateNewToken,
  persistToken,
  persistCredentials,
  configFileName,
  tokenFileName
} = require('./login-oauth')

const newToken = async () => {
  const cred = await readCredentials()
  if (!cred) throw new Error("Credentials file can't be found.")
  generateNewToken(cred)
    .then(persistToken)
    .catch(console.error)
}
const printToken = async () => {
  const cred = await readPersistedToken().catch(console.error)
  if (!cred) {
    console.error("Token file can't be found.")
  } else {
    console.log(JSON.stringify(cred))
  }
}
const printCredentials = async () => {
  const cred = await readCredentials().catch(console.error)
  if (!cred) {
    console.error("Credentials file can't be found.")
  } else {
    cred.password = '*'.repeat(cred.password.length)
    console.log(JSON.stringify(cred))
  }
}
const printJwtToken = async () => {
  const cred = await readPersistedToken().catch(console.error)
  if (!cred) {
    console.error(`Token file ${tokenFileName} can't be found.`)
  } else {
    const { token } = cred
    if (token) {
      const buff = Buffer.from(token.split('.')[1], 'base64')
      const data = JSON.parse(buff.toString('ascii'))
      console.log(JSON.stringify(data, null, 2))
    } else {
      console.error(JSON.stringify(cred))
    }
  }
}
const loginOAuth = ({ host, clientId, scope, userName, clientSecret }) => {
  const idcsHostPromise = fetch(`${host}/documents/web`, {
    redirect: 'manual'
  }).then(res => {
    if (res.status === 302) {
      return new URL(res.headers.get('location')).origin
    }
    throw res
  }) // fetch  now, use later after the questions
  const questions = [
    {
      type: 'password',
      name: 'userPassword',
      message: `Please provide the password for "${userName}":`
    }
  ]
  if (!clientSecret) {
    questions.push({
      type: 'password',
      name: 'secret',
      message: `Please provide the client secret for "${clientId}":`
    })
  }
  const inquirer = require('inquirer')
  inquirer
    .prompt(questions)
    .then(async answers => {
      let { secret, userPassword } = answers
      if (clientSecret) {
        secret = clientSecret
      }
      const password = userPassword
      const idcsHost = await idcsHostPromise
      const cred = {
        idcsHost,
        clientId,
        scope,
        secret,
        userName,
        password,
        host
      }
      await persistCredentials(cred)

      await generateNewToken(cred).then(persistToken)
      console.log(
        `Credentials and token are persisted to ${configFileName} and ${tokenFileName}.`
      )
    })
    .catch(console.error)
}
const loginBasic = ({ host, userName }) => {
  const questions = [
    {
      type: 'password',
      name: 'userPassword',
      message: `Please provide the password for "${userName}":`
    }
  ]

  const inquirer = require('inquirer')
  inquirer
    .prompt(questions)
    .then(async answers => {
      const { userPassword } = answers

      const password = userPassword

      const cred = {
        host: new URL(host).origin,
        userName,
        password
      }
      await persistCredentials(cred)
      await persistToken({
        host,
        basic: Buffer.from(`${userName}:${password}`).toString('base64')
      })
      console.log(
        `Credentials are persisted to ${configFileName} and ${tokenFileName}.`
      )
    })
    .catch(console.error)
}
if (require.main === module) {
  const commander = require('commander')
  commander
    .command('login-oauth')
    .description('Generate persistant OAuth login configuration') // command description
    .requiredOption('-h, --host <host>', 'OCE Host', v => new URL(v).origin)
    .requiredOption('-c, --client-id <client-id>', 'Client Id')
    .option('-s, --client-secret <secret>', 'Client secret')
    .requiredOption('-x, --scope <scope>', 'Scope')
    .requiredOption(
      '-u, --user-name <userName>',
      'Username of the user logging into OCE'
    )
    .action(loginOAuth)
  commander
    .command('login-basic')
    .description('Generate persistant Basic login configuration') // command description
    .requiredOption('-h, --host <host>', 'OCE Host', v => new URL(v).origin)
    .requiredOption(
      '-u, --user-name <userName>',
      'Username of the user logging into OCE'
    )
    .action(loginBasic)
  commander
    .command('new-token')
    .description('Fetch a new Access Token') // command description
    .action(newToken)
  commander
    .command('print-token')
    .description('Print the persisted Access Token')
    .action(printToken)
  commander
    .command('print-credentials')
    .description('Print the persisted Credentials file')
    .action(printCredentials)
  commander
    .command('print-jwt-token')
    .description('Print the JWT details of the persisted Access Token')
    .action(printJwtToken)

  // allow commander to parse `process.argv`
  commander.parse(process.argv)
  if (!process.argv.slice(2).length) {
    commander.help()
  }
}
