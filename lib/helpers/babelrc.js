/**
 * Based on https://github.com/babel/babel-loader/blob/9513e9b6661c94dc3c810707f185edcb6cc94990/index.js
 */
var path = require('path');
var fs = require('fs');
var exists = fs.existsSync;

var find = function (start, rel) {
  var file = path.join(start, rel);
  var opts = {};
  var up = '';

  if (exists(file)) {
    return fs.readFileSync(file, 'utf8')
  }

  up = path.dirname(start);
  if (up !== start) {
    // Reached root
    return find(up, rel);
  }

};
/**
 * Returns babelrc content related to file
 * @param loc
 * @param rel
 */
module.exports = function (loc, rel) {
  rel = rel || '.babelrc';
  return JSON.parse(find(loc, rel));
};