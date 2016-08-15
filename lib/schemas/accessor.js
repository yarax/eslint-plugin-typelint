var loader = require('./load');
var _ = require('lodash');

/**
 * Returns schema for certain native js type
 * @param {String} type native js type
 * @returns {Object} schema
 */
var getNativeSchema = function (type) {
  var schemas = loader.loadPrimitive();
  return schemas[type.toLowerCase()];
}

/**
 * Lazy reading schemas from disk
 * Retrieves schema for certain complex type
 * @param {String} type Can be nested, using dots in type name
 * @param {Object} customTypes that were build in JSDoc
 * @param {Object} settings
 */
var getSchemaByType = function (type, customTypes, settings) {
  if (!settings) {
    throw new Error('No settings in scope');
  }
  var schemas = _.assign(customTypes || {}, loader.loadComposite(settings));
  var props;
  var schemaObj;
  var i;
  if (type.match(/\./)) {
    props = type.split('.');
    schemaObj = schemas[props[0]];
    for (i = 1; i < props.length; i++) {
      if (!schemaObj || !schemaObj.properties || !schemaObj.properties[props[i]]) {
        throw new Error("Can't access to schema " + props[0] + ' with path ' + type);
      }
      schemaObj = schemaObj.properties[props[i]];
    }
    return schemaObj;
  }
  return schemas[type];
}

/**
 * @param {Array} unions
 * @param {Object} settings
 * @returns {Object}
 */
function getUnionSchema(unions, customTypes, settings) {
  var props = unions.reduce(function (unionSchema, type) {
    var typeSchema;
    typeSchema = getNativeSchema(type);
    if (!typeSchema) {
      typeSchema = getSchemaByType(type, customTypes, settings);
    }
    if (typeSchema) {
      unionSchema = _.assign(unionSchema, typeSchema.properties);
    }
    return unionSchema;
  }, {});

  if (Object.keys(props)) {
    return {
      properties: props
    }
  }
}

module.exports = {
  getSchemaByType: getSchemaByType,
  getNativeSchema: getNativeSchema,
  getUnionSchema: getUnionSchema
}