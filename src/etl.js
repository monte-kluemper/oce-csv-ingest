const parse = require('csv-parse')
const fs = require('fs')

const etl = (fileName, transformerName, config, loader, done) => {
  const transformer = require(`./${transformerName}`)
  var idx = 0;

  const parser = parse({
    delimiter: ',',
    relax_column_count: true,
    from: 2
    // on_record: (record, { lines }) =>
    // parseInt(record[11] + record[12]) > 0 ? record : undefined
  })
    .on('error', function (err) {
      console.error(err.message)
    })
    // Use the readable stream api
    .on('readable', async function () {
      let record
      const promises = []
      while ((record = this.read())) {
        idx++
        const transformed = await transformer(record, config)
        //console.log("TRANSFORMED="+JSON.stringify(transformed));
        promises.push(loader(transformed))
      }
      if (promises.length > 0) {
        //console.log(`Started ${promises.length} ingest jobs.`)
      }
      // await Promise.all(promises)
    })
    .on('end', function () {
      console.log("Ingested "+idx+" assets of type "+config.type);
      //done("Finished")
    })


  const stream = fs.createReadStream(fileName, 'utf-8')
  stream.pipe(parser);

}
module.exports = etl
