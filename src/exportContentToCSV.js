const { readConfig, client } = require('oce-management-cli')
const fs = require('fs').promises
const { mapLimit } = require('async')
const _ = require('lodash')


const doAction = async ({ repositoryId, contentType, key }) => {
  const { host, auth } = await readConfig()
  const { getItemsForManagement } = client(host, auth).itemsSearch
  const { getType } = client(host, auth).types


  const type = await getType({
    name: contentType
  }).then(r => r.json())
  const { name, links, fields } = type

  var keyFields = [];
  var header = "id,";

  for( let field of fields ) {
    switch(field.datatype) {
      case "text":
      case "largetext":
        keyFields.push({"name" : field.name, "type": "string"})
        header += field.name+","
        break;
      case "media":
      case "reference":
        keyFields.push({"name" : field.name, "type": "reference", "refType": field.referenceType.type})
        header += field.name+":@"+field.referenceType.type+","
        break;
      case "datetime":
        keyFields.push({"name" : field.name, "type": "datetime"})
        header += field.name+":d,"
        break;
      case "number":
        keyFields.push({"name" : field.name, "type": "integer"})
        header += field.name+":i,"
        break;
      case "decimal":
        keyFields.push({"name" : field.name, "type": "float"})
        header += field.name+":f,"
        break;
      case "boolean":
        keyFields.push({"name" : field.name, "type": "boolean"})
        header += field.name+":b,"
        break;
      case "json":
        //  DO NOTHING
        break;
      default:
      console.log("TYPE:"+field.datatype);
        //  DO NOTHING
    }
  }

//  console.log("HEADER:"+header)
  fs.writeFile( 'data/export-'+contentType+'.csv', header+"\n" )


  let page = 0
  let idx = 1
  const pageSize = 200
  if(key==null) { key="id" }

  var query = '(type eq "'+contentType+'")';

  let done = false
  while (!done) {
    const list = await getItemsForManagement({
      q: query,
      fields: 'all',
      repositoryId,
      offset: page * pageSize,
      limit: pageSize,
      totalResults: true,
      orderBy: 'id',
      links: 'none'
    }).then(r => r.json())
    const { count, hasMore, limit, offset, totalResults, items } = list
    //console.log(count, totalResults, offset, limit)
    var idxLen = (totalResults+"").length; if(idxLen<3) idxLen=3

    for( let item of items ) {
      //console.log("ITEM:"+JSON.stringify(item.fields))

      var record = item.id+",";

      for( let keyField of keyFields ) {
        var value = item.fields[keyField.name];
        if( value == null ) { value = "" }
        else if( value.id ) { value = value.id }        //REFERENCE
        else if( value.value ) { value = value.value }  //DATE
        record += value + ","
      }

      fs.appendFile( 'data/export-'+contentType+'.csv', record+"\n" )
      idx++
    }





    // const r =
    //await taxor(items, itemsBulkUpdate).catch(console.error)
    // console.log('from taxor', r) // JSON.stringify(r, null, 2))
    if (hasMore) {
      page++
    } else {
      done = true
    }
  }
  console.log("Exported CSV with "+(idx-1)+" assets of type "+contentType);
}
module.exports = doAction
