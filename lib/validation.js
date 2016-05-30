var allowedForArray = Object.getOwnPropertyNames(Array.prototype);
function wrapJSSchema(props) {
  return {
    type: "object",
    properties: props.reduce(function (prev, prop) {prev[prop] = 'string'; return prev;}, {})
  }
}
var nativeSchemas = {
  string: wrapJSSchema(Object.getOwnPropertyNames(String.prototype)),
  array: wrapJSSchema(Object.getOwnPropertyNames(Array.prototype)),
  number: wrapJSSchema(Object.getOwnPropertyNames(Number.prototype)),
  object: wrapJSSchema(Object.getOwnPropertyNames(Object.prototype)),
  boolean: wrapJSSchema(Object.getOwnPropertyNames(Boolean.prototype)),
};

function validateAccess(props, schema, i, useAdapters) {
  if (!props[i]) return null;
  var schemaProp = useAdapters ? adaptProp(props[i]) : props[i];
  // access to Array methods and properties
  // @TODO implement access by indexes
  if (!schema.properties && schema.items) {
    if (allowedForArray.indexOf(props[i]) === -1) {
      if (schema.items.properties && schema.items.properties[schemaProp]) return null;
      else return props[i];
    }
    return null;
  }
  if (schema.properties[schemaProp]) {
    return validateAccess(props, schema.properties[schemaProp], i + 1, useAdapters);
  } else {
    return props[i];
  }
}

function validateBySchema(param, scope, node, context, native) {
  if (param.varName !== node.object.name) return;
  try {
    var schema = native ? getNativeSchema(param.varType) : getSchemaByType(param.varType);
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
  var valid = validateAccess(scope.props, schema, 0, native ? false : true);
  if (valid !== null) {
    console.log(schema, scope.props);
    context.report(node, 'Invalid access to property ' + valid + ' for type ' + param.varType);
  }
}

function getNativeSchema(type) {
  var schema = nativeSchemas[type.toLowerCase()];
  if (!schema) {
    throw new Error('Schema or native type ' + type + ' is not implemented');
  }
  return schema;
}

/**
 * type can be with dots
 * @param type
 */
function getSchemaByType(type) {
  if (type.match(/\./)) {
    var props = type.split('.');
    var schemaObj = schemas[props[0]];
    for(var i = 1; i < props.length; i++) {
      if (!schemaObj.properties || !schemaObj.properties[props[i]]) {
        throw new Error("Can't access to schema " + props[0] + " with path " + type);
      }
      schemaObj = schemaObj.properties[props[i]];
    }
    return schemaObj;
  } else {
    return schemas[type];
  }
}

function adaptProp(prop) {
  return adapters.reduce(function (prev, adaptfunc) {
    return adaptfunc(prev);
  }, prop);
}