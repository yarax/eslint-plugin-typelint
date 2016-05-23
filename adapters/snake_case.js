module.exports = function (prop) {
  return prop.split(/(?=[A-Z])/).join('_').toLowerCase();
}