var loader = require('./load');
var config = require('../config');
var _ = require('lodash');

/**
 * Returns schema for certain native js type
 * @param {String} type native js type
 * @returns {Object} schema
 */
var getNativeSchema = function (type) {
  var schemas = loader.loadPrimitive();
  return schemas[type.toLowerCase()];
};

var getSchemaByRef = function (ref) {
  var parts = ref.split('/');
  if (parts[0] !== '#' || parts[1] !== 'definitions' || parts.length !== 3) {
    throw new Error("Don't know how to resolve $ref: " + ref);
  }
  var schema = getSchemaByType(parts[2]);
  if (!schema) {
    throw new Error('Schema with name ' + parts[2] + "wasn't found (via $ref " + ref +")");
  }
  return schema;
}

/**
 * Lazy reading schemas from disk
 * Retrieves schema for certain complex type
 * @param {String} type Can be nested, using dots in type name
 * @param {Object} customTypes that were build in JSDoc
 */
var getSchemaByType = function (type, customTypes) {
  var settings = config.settings;
  if (!settings) {
    throw new Error('No settings were set');
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
        throw new Error("Can't access to schema " + props[0] + ' with path ' + type + '. Possible types: ' + JSON.stringify(Object.keys(schemas)));
      }
      schemaObj = schemaObj.properties[props[i]];
    }
    return schemaObj;
  }
  return schemas[type];
}

/**
 * @param {Array} unions
 * @param {Object} customTypes
 * @returns {Object}
 */
function getUnionSchema(unions, customTypes) {
  var props = unions.reduce(function (unionSchema, type) {
    var typeSchema;
    typeSchema = getNativeSchema(type);
    if (!typeSchema) {
      typeSchema = getSchemaByType(type, customTypes);
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
  getUnionSchema: getUnionSchema,
  getSchemaByRef: getSchemaByRef
}