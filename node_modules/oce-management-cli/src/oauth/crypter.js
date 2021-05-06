const crypto = require('crypto')
const { readFile, writeFile, mkdir } = require('fs').promises

const path = require('path')
const homedir = require('os').homedir()
const keyPath = path.join(homedir, '.oce', '.oce-key')
const generatePair = err => {
  if (err.code === 'ENOENT') {
    var { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096, // the length of your key in bits
      publicKeyEncoding: {
        type: 'pkcs1',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })
    const writeKey = () =>
      writeFile(keyPath, privateKey, {
        encoding: 'utf-8',
        mode: 0o400,
        flag: 'wx'
      })
        .then(() => privateKey)
        .catch(console.error)
    return mkdir(path.join(homedir, '.oce'), {
      recursive: true,
      mode: 0o700
    }).then(writeKey)
  } else {
    throw err
  }
}
const getPrivateKey = async () => {
  return readFile(keyPath, 'utf-8').catch(generatePair)
}
const encryptKey = async buf => {
  const privateKey = await getPrivateKey()
  return crypto.publicEncrypt(privateKey, buf)
}
const decryptKey = async buf => {
  const privateKey = await getPrivateKey()
  return crypto.privateDecrypt(privateKey, buf)
}
const encrypt = async text => {
  const key = crypto.randomBytes(32)

  const encryptedKey = await encryptKey(key)

  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const buf = Buffer.from(text, 'utf-8')

  const encrypted = Buffer.concat([cipher.update(buf), cipher.final()])

  return [encryptedKey, iv, encrypted].map(b => b.toString('base64')).join('.')
}

const decrypt = async text => {
  const textParts = text.split('.')
  if (textParts.length !== 3) throw new Error('Not the right number of parts')
  const [encryptedKey, iv, encryptedText] = textParts.map(s =>
    Buffer.from(s, 'base64')
  )
  const key = await decryptKey(encryptedKey)
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final()
  ])

  return decrypted.toString('utf8')
}

const writeEncrypted = (fileName, obj) => {
  return encrypt(JSON.stringify(obj)).then(s =>
    writeFile(fileName, s, {
      encoding: 'utf-8',
      mode: 0o600
    })
  )
}
const readEncrypted = filename => {
  return readFile(filename, 'utf-8')
    .then(decrypt)
    .then(s => JSON.parse(s))
}

module.exports = { readEncrypted, writeEncrypted }
