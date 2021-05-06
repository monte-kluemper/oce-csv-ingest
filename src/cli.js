#!/usr/bin/env node

const { readConfig } = require('oce-management-cli')
const ingestAssetsAction = require('./ingestAssetsAction')
const generateReferenceFileAction = require('./generateReferenceFile')
const exportContentToCSVAction = require('./exportContentToCSV')

const testAuth = async () => {
  const fetch = require('node-fetch')
  const { host, auth } = await readConfig()
  const path = '/content/management/api/v1.1/dataTypes'

  const headers = {
    Authorization: auth,
    Accept: 'application/json'
  }
  const options = { method: 'GET', headers }
  const r = await fetch(host + path, options)
  if (r.ok) {
    console.log(await r.text())
  } else {
    console.log(r.status)
    console.log(r.headers.get('x-oracle-dms-ecid'))

    console.log(host + path)
    console.log(auth)
    const jwt = auth.split(' ')[1].split('.')[1]
    console.log(Buffer.from(jwt, 'base64').toString('utf8'))
    console.log(await r.text())
  }
}

const main = async () => {
  const commander = require('commander')

  commander
    .command('ingestAssets <filename>')
    .description('Import CSV file') // command description
    .requiredOption('-r, --repositoryId <repositoryId>', 'Repository to Ingest into' )
    .requiredOption('-c, --contentType <contentType>', 'Content Type to Create')
    .option('-l, --locale <locale>', 'Locale of the content (default: en-US)')
    .option('-v, --variant', 'Is this locale a variant')
    .option('-t, --nontranslatable', 'Is this content translatable')
    .option('-a, --append', 'Do not delete previous references generated for this content type.')
    .action(ingestAssetsAction)

  commander
    .command('generateReferenceFile')
    .description('Generate a Reference File for subsequent import of other assets') // command description
    .requiredOption('-r, --repositoryId <repositoryId>', 'Repository to Query into' )
    .requiredOption('-c, --contentType <contentType>', 'Content Type to Query')
    .option('-k, --key <key>', 'Type of key to use as ID (id|name|slug|sequence)')
    .action(generateReferenceFileAction)

  commander
    .command('exportContentToCSV')
    .description('Export Assets of a particular type into a CSV File') // command description
    .requiredOption('-r, --repositoryId <repositoryId>', 'Repository to Query into' )
    .requiredOption('-c, --contentType <contentType>', 'Content Type to Query')
    .action(exportContentToCSVAction)

  commander
    .command('test-auth')
    .description('Test login')
    .action(testAuth)

  // allow commander to parse `process.argv`
  await commander.parseAsync(process.argv)

  if (!process.argv.slice(2).length) {
    commander.help()
  }
}
if (require.main === module) {
  main().catch(console.error)
}
