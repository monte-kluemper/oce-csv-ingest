const _ = require('lodash')
var config = "";

const fieldTransform = (name, value, config) => {
  const type = config.schema[name].type
  switch (type) {
    case 'string':
      return (value==null||value.length==0) ? null : value;
    case 'datetime':
      return (value==null||value.length==0) ? null : {"value":value,"timezone":"UTC"};
    case 'number':
      return (value==null||value.length==0) ? null : parseInt(value)
    case 'decimal':
      return (value==null||value.length==0) ? null : parseFloat(value)
    case 'boolean':
      return (value==null||value.length==0) ? null : (value.toLowerCase() !== 'true');
    default:
      if(type.startsWith("@")) {
        var refType = type.substring(1);
        if( refType==null || value==null || value.length==0 )  { return null };
        if((value.startsWith("CORE")||value.startsWith("CONT"))&&value.length==36) {
          // OCE REFERENCE FIELD
          value = {"id":value,"type":refType}
          return value;
        }
        var refMap = config.ref.get(refType);
        if( refMap != null ) { return refMap.get(value); } else { return null; }
      }
  }
}

const notEmty = v => v && v.trim().length > 0

module.exports = (record, config) => {
  //console.log("Config:"+JSON.stringify(config));
  const fields = config.columns.reduce((aggr, n, i) => {
    if (config.schema[n] && notEmty(record[i])) {
      var fieldValue = fieldTransform(n, record[i], config);
      if( fieldValue!= null ) {
        return { ...aggr, [config.schema[n].name]: fieldValue }
      }
    }
    return aggr
  }, {})

  var masterData = (config.master==null) ? null : config.master.get(record[0]);
  var varSetId = (masterData==null) ? null : masterData.varSetId;
  var sourceId = (masterData==null) ? null : masterData.sourceId;

  var requestData = {
    recordNum: record[0],
    name: _.truncate(fields[config.name].replace(/\([^)]*\)+/, '').trim(), {
      length: 64
    }),
    description: fields[config.name],

    type: config.type,
    language: config.language,
    translatable: config.translatable,
    languageIsMaster: !config.variant,
    varSetId: varSetId,
    sourceId: sourceId,
    fields
  };

  //if( varSetId != null ) { requestData.varSetId = varSetId; }
  //if( sourceId != null ) { requestData.sourceId = sourceId; }

  //console.log("REQUEST DATA:"+JSON.stringify(requestData));

  return Promise.resolve(requestData);
}
