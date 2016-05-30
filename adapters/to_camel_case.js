module.exports = function (prop) {
  return prop.split('_')
    .map(function (part, i) {
      if (!i) return part;
    return part[0].toUpperCase() + part.substr(1);
  })
    .join('');
};