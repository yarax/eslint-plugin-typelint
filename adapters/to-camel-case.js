function convertString(prop) {
  if (prop === '_id') return '_id';
  return prop.split('_')
    .map(function (part, i) {
      if (!i) return part;
      return part[0].toUpperCase() + part.substr(1);
    })
    .join('');
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
