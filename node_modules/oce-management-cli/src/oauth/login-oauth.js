const fetch = require('node-fetch')
const moment = require('moment')

const configFileName = process.env.OCE_CONFIG_FILE
  ? process.env.OCE_CONFIG_FILE
  : '.oce-auth-config.enc'
const tokenFileName = process.env.OCE_TOKEN_FILE
  ? process.env.OCE_TOKEN_FILE
  : '.oce-token.enc'

const { readEncrypted, writeEncrypted } = require('./crypter')
const userToken = async ({
  idcsHost,
  clientId,
  secret,
  scope,
  userName,
  password
}) => {
  const url = `${idcsHost}/oauth2/v1/token`
  const form = new URLSearchParams()
  form.append('grant_type', 'password')
  form.append('username', userName)
  form.append('password', password)
  form.append('scope', scope)

  const body = form.toString()
  const auth =
    'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64')
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: auth
    },
    body
  })
}

/**
 * Get the Access Token from it's persisted storage. Currently that is the file system.
 *
 */
const readPersistedToken = () => {
  return readEncrypted(tokenFileName)
    .then(({ host, expiresAt, token, basic }) => {
      if (basic) return { host, basic }
      if (moment().isBefore(moment(expiresAt))) {
        return { host, expiresAt, token }
      } else {
        return { host, expiresAt }
      }
    })
    .catch(err => {
      if (err.code === 'ENOENT') return null
      console.error(
        `Error when trying to read ${tokenFileName}: ${err.code} - ${err.message}.`
      )
      return null
    })
}
const persistToken = data => {
  writeEncrypted(tokenFileName, data)
}

const generateNewToken = cred => {
  return userToken(cred)
    .then(response => {
      if (response.ok) return response.json()
      throw response
    })
    .then(data => {
      const { access_token: token, expires_in: expiresIn } = data
      const exp = moment().add(expiresIn, 'seconds')
      const { host } = cred

      return { host, token, expiresAt: exp.toISOString() }
    })
}

const persistCredentials = async raw => {
  writeEncrypted(configFileName, raw).catch(console.error)
}
const readCredentials = async () => {
  return readEncrypted(configFileName)
}

const getToken = () => {
  /* 1. see if persisted token is there and valid
     2. otherwise, if no login-config, bail
     3. go and fetch new token based on login config
   */
  return readPersistedToken(data => {
    if (data && data.token) return data.token
    return readCredentials().then(cred => {
      if (cred && cred.idcsHost) {
        return generateNewToken(cred)
      }
    })
  })
}

const getAuth = () => {
  /* 1. see if persisted token is there and valid
     2. otherwise, if no login-config, bail
     3. go and fetch new token based on login config
   */
  return readPersistedToken(data => {
    if (data && data.token) return `Bearer ${data.token}`
    if (data && data.basic) return `Basic ${data.basic}`
    return readCredentials().then(cred => {
      if (cred && cred.idcsHost) {
        return generateNewToken(cred)
      }
    })
  })
}
module.exports = {
  readPersistedToken,
  readCredentials,
  generateNewToken,
  persistToken,
  persistCredentials,
  configFileName,
  tokenFileName,
  getToken,
  getAuth
}
