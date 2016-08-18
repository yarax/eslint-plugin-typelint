var allowedForArray = Object.getOwnPropertyNames(Array.prototype);
var accessor = require('./schemas/accessor');

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
    schema = accessor.getNativeSchema(schema);
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
 * Sends eslint report in case of problems
 * @param param <var>
 * @param scope <scope>
 * @param {Object} node
 * @param {Object} context
 * @param {Object} settings
 */
var validate = function (param, scope, node, context, settings) {
  var schema;
  if (param.unions) {
    param.varType = param.unions.join('|');
    schema = accessor.getUnionSchema(param.unions, param.definedTypes, settings);
  } else if (param.varType) {
    //if (['object'].indexOf(param.varType.toLowerCase()) !== -1) return; // don't check generic object types
    schema = accessor.getNativeSchema(param.varType);
    if (!schema) {
      schema = accessor.getSchemaByType(param.varType, param.definedTypes, settings);
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

  var inValid = validateAccess(scope.props, schema, 0);

  if (inValid !== null) {
    context.report(node, 'Invalid access to property ' + inValid + ' for type ' + param.varType);
  }
}

module.exports = {
  validate: validate
};