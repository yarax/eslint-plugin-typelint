function convertString(prop) {
  return prop.split(/(?=[A-Z])/).join('_').toLowerCase();
}

function lookup(schema) {
  var newKey;
  if (typeof schema !== 'object') return schema;
  return Object.keys(schema).reduce(function (prev, key, i) {
    newKey = convertString(key);
    prev[newKey] = lookup(schema[key]);
    return prev;
  }, {});
}

module.exports = function (schemas) {
  return lookup(schemas);
}
