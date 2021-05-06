const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const algorithm = 'aes256'
const util = require('util')
const randomBytes = util.promisify(crypto.randomBytes)
const keyFile = () => {
  const homedir = require('os').homedir()
  return path.join(homedir, '.oce', '.key')
}
const encrypt = async text => {
  const key = await getKey()
  const iv = await generateIV()

  const msg = encryptText(key, iv, text, 'hex')
  const ivh = iv.toString('hex')
  return [ivh, msg].join(':')
}

const decrypt = async text => {
  const key = await getKey()

  const [ivh, msg] = text.split(':')

  const iv = Buffer.from(ivh, 'hex')
  return decryptText(key, iv, msg, 'hex')
}

const generateIV = () => {
  return randomBytes(16)
}

const generateKey = () => {
  return randomBytes(32) // 32 random bytes for aes256
}

const encryptText = (key, iv, text, encoding) => {
  var cipher = crypto.createCipheriv(algorithm, key, iv)

  encoding = encoding || 'binary'

  var result = cipher.update(text, 'utf8', encoding)
  result += cipher.final(encoding)

  return result
}

const decryptText = (key, iv, text, encoding) => {
  var decipher = crypto.createDecipheriv(algorithm, key, iv)

  encoding = encoding || 'binary'

  var result = decipher.update(text, encoding)
  result += decipher.final()

  return result
}

const getKey = async () => {
  const fsp = fs.promises
  try {
    const key = await fsp.readFile(keyFile())
    return key
  } catch (err) {
    if (err.code === 'ENOENT') {
      // file does not exist
      const key = await generateKey()
      const dir = path.dirname(keyFile())
      try {
        await fsp.mkdir(dir, { recursive: true })
      } catch (err) {
        console.error(err)
      }
      await fsp.writeFile(keyFile(), key)
      return key
    } else {
      throw err
    }
  }
}

module.exports = { encrypt, decrypt }
