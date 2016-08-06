var allowedForArray = Object.getOwnPropertyNames(Array.prototype);
var loader = require('../lib/schemas/load');
var _ = require('lodash');
var __schemas = {};
var __settings;

/**
 * Validates chain of props according to schema
 * @param {Array} props
 * @param {Object} schema JSONSchema
 * @param {Number} i index of prop
 * @returns {*} null if ok, prop name if not valid
 */
var validateAccess = function(props, schema, i) {
  var schemaProp;
  if (!props[i]) return null;
  schemaProp = props[i];
  if (typeof schema !== 'object') { // got to the end point, use native types
    schema = getNativeSchema(schema);
  }
  // access to Array methods and properties
  if (!schema.properties && schema.items) {
    if (allowedForArray.indexOf(props[i]) === -1) {
      if (schema.items.properties && schema.items.properties[schemaProp]) {
        return null;
      }
      return props[i];
    }
    return null;
  }
  if (schema.properties && schema.properties[schemaProp]) {
    return validateAccess(props, schema.properties[schemaProp], i + 1);
  }
  return props[i];
}

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
 */
var getSchemaByType = function (type) {
  if (!__settings) {
    throw new Error('No settings in scope');
  }
  var schemas = loader.loadComposite(__settings);
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
 * @returns {Object}
 */
function getUnionSchema(unions) {
  var props = unions.reduce(function (unionSchema, type) {
    var typeSchema;
    typeSchema = getNativeSchema(type);
    if (!typeSchema) {
      typeSchema = getSchemaByType(type);
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

function validateByTypeName(param, context, node, scope) {
  var schema;
  if (param.unions) {
    param.varType = param.unions.join('|');
    schema = getUnionSchema(param.unions);
  } else if (param.varType) {
    if (['object'].indexOf(param.varType.toLowerCase()) !== -1) return; // don't check generic object types
    schema = getNativeSchema(param.varType);
    if (!schema) {
      schema = getSchemaByType(param.varType);
    }
  } else {
    throw new Error('Broken param type ' + JSON.stringify(param));
  }

  if (!schema) {
    context.report(node, 'Unknown schema and object type ' + param.varType);
    return;
  }
  if (!schema.properties) {
    context.report(node, 'Type ' + param.varType + ' has no properties. Trying to access "' + scope.props.join('.') + '"');
    return;
  }

  return validateAccess(scope.props, schema, 0);
}

function validateByUnionType(param, context, node, scope) {
  // merge all param.unions
}

/**
 * Sends eslint report in case of problems
 * @param param <var>
 * @param scope <scope>
 * @param {Object} node
 * @param {Object} context
 */
var validate = function (param, scope, node, context) {
  var inValid = validateByTypeName(param, context, node, scope);

  if (inValid !== null) {
    context.report(node, 'Invalid access to property ' + inValid + ' for type ' + param.varType);
  }
}

function addSchemas(type, schemas) {
  __schemas[type] = schemas;
}

function addSettings(settings) {
  __settings = settings;
}

module.exports = {
  addSchemas: addSchemas,
  addSettings: addSettings,
  validate: validate
};