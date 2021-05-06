const { readConfig, client } = require('oce-management-cli')
const fs = require('fs').promises
const { mapLimit } = require('async')
const _ = require('lodash')


const doAction = async ({ repositoryId, contentType, key }) => {
  const { host, auth } = await readConfig()
  const { getItemsForManagement } = client(host, auth).itemsSearch
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
      var id = "";
      switch(key.toLowerCase()) {
        case "id":
          id = item.id;
          break;
        case "name":
          id = item.name;
          break;
        case "slug":
          id = item.slug;
          break;
        case "sequence":
          id = "0000"+idx;
          id = id.substring(id.length-idxLen);
          break;
        default:
          id = item.id;
      }

      var record = `${id},${item.id},${item.name},${item.slug},\n`
      //console.log("ITEM:"+record)
      fs.appendFile( 'ref/'+contentType+'.csv', record )
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
  console.log("Generated Reference File with "+(idx-1)+" asset reference(s) for type "+contentType);
}
module.exports = doAction
