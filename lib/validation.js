var allowedForArray = Object.getOwnPropertyNames(Array.prototype);
var loader = require('../lib/schemas/load');
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
  if (!__schemas.primitive) {
    throw new Error('Primitive schemas were not loaded');
  }
  var schema = __schemas.primitive[type.toLowerCase()];
  if (!schema) {
    throw new Error('Schema or native type ' + type + ' is not implemented');
  }
  return schema;
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
  addSchemas('composite', schemas);

  if (!__schemas.composite) {
    throw new Error('Composite schemas were not loaded');
  }
  var props;
  var schemaObj;
  var i;
  if (type.match(/\./)) {
    props = type.split('.');
    schemaObj = __schemas.composite[props[0]];
    for (i = 1; i < props.length; i++) {
      if (!schemaObj || !schemaObj.properties || !schemaObj.properties[props[i]]) {
        throw new Error("Can't access to schema " + props[0] + ' with path ' + type);
      }
      schemaObj = schemaObj.properties[props[i]];
    }
    return schemaObj;
  }
  return __schemas.composite[type];
}

function validateByTypeName(param, context, node, scope) {
  var schema;
  if (['object'].indexOf(param.varType.toLowerCase()) !== -1) return; // don't check generic object types
  try {
    // @TODO
    // 1. remove primitive settings, use both
    // 2. firstly check primitive
    // 3. check in varTypes (typedef there and @params)
    // 4, and only after that load anc check external types
    //
    // in load merge any Of and think what with enums, here just check properties
    schema = param.kind === 'primitive' ? getNativeSchema(param.varType) : getSchemaByType(param.varType);
  } catch (e) {
    context.report(node, e.message);
    return;
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
 * @param {String} typeCheckKind primitive|composite
 */
var validateBySchema = function (param, scope, node, context, typeCheckKind) {
  var valid;
  if (param.kind !== typeCheckKind) return;

  if (param.varType) {
    valid = validateByTypeName(param, context, node, scope);
  }

  if (param.unions) {
    valid = validateByUnionType(param, context, node, scope);
  }

  if (valid !== null) {
    context.report(node, 'Invalid access to property ' + valid + ' for type ' + param.varType);
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
  validateBySchema: validateBySchema
};