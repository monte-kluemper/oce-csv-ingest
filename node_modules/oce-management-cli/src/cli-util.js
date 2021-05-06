const printJSON = json => {
  console.log(JSON.stringify(json, null, 2))
}
const printText = text => {
  console.log(text)
}
const printBlob = blob => {
  if (process.stdout.isTTY) {
    console.log('<blob>')
  } else {
    console.log(blob)
  }
}
const responseHandler = response => {
  const contentType = response.headers.get('content-type')
  if (response.ok) {
    if (contentType && contentType.includes('application/json')) {
      return response.json().then(printJSON)
    } else if (contentType && contentType.includes('text/')) {
      return response.text().then(printText)
    } else {
      return response.blob().then(printBlob)
    }
  } else {
    console.error('Error with ' + response.status, contentType)
    if (contentType && contentType.includes('application/json')) {
      return response.json().then(printJSON)
    } else if (contentType && contentType.includes('text/')) {
      return response.text().then(printText)
    } else {
      return response.blob().then(printBlob)
    }
  }
}

const readStdIn = () => {
  return new Promise((resolve, reject) => {
    process.stdin.setEncoding('utf8')
    let data = ''
    if (process.stdin.isTTY) {
      console.log(
        'Please provide a body to send with the request. End the input with Ctrl-D.\n'
      )
    }
    process.stdin.on('readable', () => {
      let chunk
      // Use a loop to make sure we read all available data.
      while ((chunk = process.stdin.read()) !== null) {
        data += chunk
      }
    })

    process.stdin.on('end', () => {
      resolve(data)
    })
  })
}
const getAuth = require('./oauth')
const readConfig = async () => {
  let host = process.env.OCE_HOST
  const auth = process.env.OCE_AUTH
  if (host && auth) {
    host = new URL(host).origin
    return { host, auth }
  }
  const env = process.env.OCE_CLI_CONFIG
  if (env) {
    const { decrypt } = require('./enc')
    const { host, auth } = JSON.parse(await decrypt(env))
    return { host, auth }
  }

  const config = await getAuth()
  if (!(config && (config.token || config.basic))) {
    throw new Error(
      'The oauth token could not be found. Please log in first with oce-management oauth-login.'
    )
  }
  if (config.token) { return { host: new URL(config.host).origin, auth: `Bearer ${config.token}` } }
  if (config.basic) { return { host: new URL(config.host).origin, auth: `Basic ${config.basic}` } }
}
const writeConfig = data => {
  const fs = require('fs').promises

  return fs.writeFile('.oce-config.json', JSON.stringify(data, null, 2), {
    encoding: 'utf-8',
    mode: 0o600
  })
}
module.exports = { readConfig, writeConfig, readStdIn, responseHandler }
