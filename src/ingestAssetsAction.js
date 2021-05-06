const etl = require('./etl')
const { readConfig, client } = require('oce-management-cli')
const fs = require('fs').promises
const lineReader = require('line-reader')
Promise = require('bluebird');

const cq = require('concurrent-queue')
const doAction = async (
  file,
  { repositoryId, contentType, locale, variant, nontranslatable, append }
) => {
  const transformer = "transformer"  // generic transformer
  if( locale == null || locale == "" ) { locale = "en-US" }
  var varLocale = (variant)?locale:"";
  var refFileName = (varLocale.length>0) ? contentType+'-'+varLocale : contentType;

  const { host, auth } = await readConfig()
  const { createItem } = client(host, auth).items
  const { itemsBulkUpdate } = client(host, auth).itemsBulkOperations

  const retry = (obj, count) => {
    if (count > 5) throw new Error(`Retried too often ${obj.body.name}`)

    return createItem(obj).catch(err => {
      if (err.name === 'FetchError') {
        return retry(obj, count + 1)
      } else {
        throw err
      }
    })
  }
  let count = 0
  let concurrency = 0
  var queue = cq()
    .limit({ concurrency: 20 })
    .process(async obj => {
      const num = count++
      concurrency++
      try {
        const start = Date.now()
        const { recordNum, ...o } = obj
        // console.log(o)
        const r = await retry(
          { body: { ...o, repositoryId }, xRequestedWith: 'XMLHttpRequest' },
          0
        ).then(r => r.json())
        const t2 = Date.now()
        const elapsed = t2 - start
        const c = concurrency--
        //var varLocale = (variant)?locale:"";
        if (r.id) {
          return {
            contentType,
            varLocale,
            recordNum,
            start,
            num,
            name: obj.name,
            id: r.id,
            varSetId: r.varSetId,
            elapsed,
            concurrency: c
          }
        } else {
          console.error('Failed to created asset', o, r)
          return {
            contentType,
            varLocale,
            recordNum,
            start,
            num,
            name: obj.name,
            id: "Error:" + r.detail,
            varSetId: "",
            elapsed,
            concurrency: c
          }
        }
      } catch (err) {
        concurrency--
        throw err
      }
    })
  const format = new Intl.NumberFormat('en-US', {
    style: 'unit',
    unit: 'millisecond'
  }).format


  if( !append ) { fs.open('ref/'+contentType+'.csv', 'w') }

  const loader = async obj => {
    return queue(obj)
      .then(({ contentType, varLocale, start, recordNum, name, id, varSetId, elapsed, num, concurrency }) => {
        fs.appendFile('ingest.log',
          `${new Date(
            start
          ).toISOString()} - ${num} - "${name}" - ${recordNum} - ${id} ingested in ${format(
            elapsed
          )}, concurrency ${concurrency}.\n`
        )
        if( !id.startsWith("Error") ) {
          var refFileName = (varLocale.length>0) ? contentType+'-'+varLocale : contentType;
          fs.appendFile( 'ref/'+refFileName+'.csv',
            `${recordNum},${id},${varSetId},\n`
          )
        }
      })
      .catch(console.error)
  }

  var config = {
    name : "",
    ref : new Map(),
    type : contentType,
    language : locale,
    variant : variant,
    translatable : !nontranslatable
  }

  var references = [];

  // Read First Line in CSV file to get configuration
  var eachLine = Promise.promisify(lineReader.eachLine);
  await eachLine(file, function(line) {
    var schema = {};
    var columns = []
    var columnNames = line.split(',');
    for( let columnName of columnNames ) {
      var colName = columnName;
      if( colName != "id" ) {
        var colType = "string";
        if( columnName.includes(':') ) {
          var cn = columnName.split(':');
          colName = cn[0];
          colType = cn[1];

          //expand column types
          if( colType.length==0 || colType.startsWith('s') ) { colType = "string" }
          else if( colType.startsWith('n') ) { colType = "number" }
          else if( colType.startsWith('f') ) { colType = "decimal" }
          else if( colType.startsWith('d') ) { colType = "datetime" }
          else if( colType.startsWith('b') ) { colType = "boolean" }
          else if( colType.startsWith('@')) {
            var refType = colType.substring(1);
            if( refType != "null" && !references.includes(refType) ) { references.push(refType); }
          }
        }

        // Use the first String field in the file as the Asset Name
        if( colType == "string" && config.name == "" ) {
          config.name = colName;
        }
        schema[colName] = { name : colName, type : colType }
        config.schema = schema;
      }
      columns.push(colName);
    }
    config.columns = columns;

    return false;
  }).then(function() {
    //console.log('done');
  }).catch(function(err) {
    console.error(err);
  });

  for( let refType of references ) {
    var refMap = new Map();
    var refLine = Promise.promisify(lineReader.eachLine);
    var filename = (variant) ? refType+'-'+locale : refType;

    await refLine('ref/'+filename+'.csv', function(line) {
      var cols = line.split(',');
      refMap.set( cols[0], {"id":cols[1],"type":refType} );
    }).then(function() {
      console.log("Loading references for '"+filename+"' type. "+refMap.size+" references loaded.");
      config.ref.set(refType, refMap);
    }).catch(function(err) {
      console.log("Warning:  No reference values for "+filename+ " in /ref folder.  This field will not be processed.");
    });
  }


  // If variant, load the master list for current asset type to references
  if( variant ) {
    var masterMap = new Map();
    var masterLine = Promise.promisify(lineReader.eachLine);
    await masterLine('ref/'+contentType+'.csv', function(line) {
      var cols = line.split(',');
      masterMap.set( cols[0], {"sourceId":cols[1],"varSetId":cols[2]} );
    }).then(function() {
      console.log("Loading master for '"+contentType+"' type. "+masterMap.size+" references loaded.");
      config.master = masterMap;
    }).catch(function(err) {
      console.log("Error:  No master values for "+contentType+" in /ref folder.  This field will not be processed.");
    });
  }

  etl(file, transformer, config, loader)
}


module.exports = doAction
