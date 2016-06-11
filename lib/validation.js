var allowedForArray = Object.getOwnPropertyNames(Array.prototype);
var __schemas;
var __adapters;
var nativeSchemas;

function wrapJSSchema(props) {
  return {
    type: 'object',
    properties: props.reduce(function (prev, prop) {
      prev[prop] = 'string';
      return prev;
    }, {})
  };
}

nativeSchemas = {
  string: wrapJSSchema(Object.getOwnPropertyNames(String.prototype)),
  array: wrapJSSchema(Object.getOwnPropertyNames(Array.prototype)),
  number: wrapJSSchema(Object.getOwnPropertyNames(Number.prototype)),
  object: wrapJSSchema(Object.getOwnPropertyNames(Object.prototype)),
  boolean: wrapJSSchema(Object.getOwnPropertyNames(Boolean.prototype)),
};

function adaptProp(prop) {
  return __adapters.reduce(function (prev, adaptfunc) {
    return adaptfunc(prev);
  }, prop);
}

/**
 * Validates chain of props according to schema
 * @param {Array} props
 * @param {Object} schema JSONSchema
 * @param {Number} i index of prop
 * @param {Boolean} useAdapters
 * @returns {*} null if ok, prop name if not valid
 */
function validateAccess(props, schema, i, useAdapters) {
  var schemaProp;
  if (!props[i]) return null;
  schemaProp = useAdapters ? adaptProp(props[i]) : props[i];
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
    return validateAccess(props, schema.properties[schemaProp], i + 1, useAdapters);
  }
  return props[i];
}

/**
 * Returns schema for certain native js type
 * @param {String} type native js type
 * @returns {Object} schema
 */
function getNativeSchema(type) {
  var schema = nativeSchemas[type.toLowerCase()];
  if (!schema) {
    throw new Error('Schema or native type ' + type + ' is not implemented');
  }
  return schema;
}

/**
 * Retrieves schema for certain complex type
 * @param {String} type Can be nested, using dots in type name
 */
function getSchemaByType(type) {
  var props;
  var schemaObj;
  var i;
  if (type.match(/\./)) {
    props = type.split('.');
    schemaObj = __schemas[props[0]];
    for (i = 1; i < props.length; i++) {
      if (!schemaObj.properties || !schemaObj.properties[props[i]]) {
        throw new Error("Can't access to schema " + props[0] + ' with path ' + type);
      }
      schemaObj = schemaObj.properties[props[i]];
    }
    return schemaObj;
  }
  return __schemas[type];
}

/**
 * Sends eslint report in case of problems
 * @param param <var>
 * @param scope <scope>
 * @param {Object} node
 * @param {Object} context
 * @param {String} format
 */
function validateBySchema(param, scope, node, context, format) {
  var schema;
  var valid;
  if (param.varName !== node.object.name) return;
  if (['object', 'array'].indexOf(param.varType.toLowerCase()) !== -1) return; // don't check generic object types
  try {
    schema = format === 'native' ? getNativeSchema(param.varType) : getSchemaByType(param.varType);
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

  valid = validateAccess(scope.props, schema, 0, format);
  if (valid !== null) {
    context.report(node, 'Invalid access to property ' + valid + ' for type ' + param.varType);
  }
}

module.exports = function (schemas, adapters) {
  __schemas = schemas;
  __adapters = adapters;
  return validateBySchema;
};