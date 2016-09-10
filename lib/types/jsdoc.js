var accessor = require('../schemas/accessor');

function buildObjectType(type) {
  var schema = {};
  if (type.type === 'NameExpression') {
    const endSchema = accessor.getSchemaByType(type.name);
    return endSchema || type.name;
  } else if (type.type === 'RecordType') {
    schema.type = 'object';
    schema.properties = (type.fields || []).reduce((props, field) => {
      props[field.key] = buildObjectType(field.value);
      return props;
    }, {});
  } else if (type.type === 'ArrayType') {
    schema.type = 'array';
    // supported only elements of one type
    schema.items = buildObjectType(type.elements[0]);
  } else if (type.type === 'FieldType') {
    schema.type = 'object';
    schema.properties = {};
    schema.properties[type.key] = buildObjectType(type.value);
  }
  return schema;
}

function collectNestedTypes(item, definedTypes) {
  const type = {};
  if (item.type.type === 'RecordType') {
    type.type = 'object';
  } else {
    type.type = 'array';
    // JSON Schema supports only arrays of one type
    type.items = buildObjectType(item.type.elements[0]);
  }
}

function getAllUnions(elements) {
  return elements.reduce(function (all, item) {
    if (item.type === 'UnionType') {
      all = all.concat(getAllUnions(item.elements));
    } else if (item.type === 'NameExpression') {
      all.push(item.name);
    } else {
      console.log('Unknown type' + item.type);
    }
    return all;
  }, []);
}

function collectSlicedTypes(item, definedTypes) {
  var isObj = item.type.name.toLowerCase() === 'object';
  if (!isObj && !item.name.match(/\./)) return;
  var accessorArr = item.name.split('.');
  accessorArr.reduce(function (obj, propName, i) {
    if (i === 0) {
      obj[propName] = obj[propName] || {title: propName, properties: {}};
      obj = obj[propName].properties;
    } else {
      if (i !== accessorArr.length - 1 || isObj) {
        obj[propName] = {properties: {}};
        obj = obj[propName].properties;
      } else {
        obj[propName] = {type: item.type.name};
      }
    }
    return obj;
  }, definedTypes);

  return definedTypes;
}

module.exports = {
  buildObjectType,
  collectNestedTypes,
  getAllUnions,
  collectSlicedTypes
};