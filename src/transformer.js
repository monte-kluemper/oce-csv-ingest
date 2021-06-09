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

        // Allow multiple values for a reference field, separated by "|"
        var values = value.split('|');
        var result = [];
        for( let val of values ) {
          if((val.startsWith("CORE")||val.startsWith("CONT"))&&val.length==36) {
            // OCE REFERENCE FIELD
            valObj = {"id":val,"type":refType}
          } else {
            var refMap = config.ref.get(refType);
            if( refMap != null ) {
              valObj = refMap.get(val);
            } else {
              valObj = null;
            }
          }
          if( valObj!= null ) { result.push( valObj ); }
        }
        if( result.length == 0 ) {
          return null;
        } else if( result.length == 1 ) {
          return result[0];
        } else {
          return result;
        }
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
