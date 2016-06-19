/* eslint-disable  import/no-unresolved */
var nodePath = require('path');
var jsyaml = require('js-yaml');
var fs = require('fs');

/**
 * Handles certain file path and populates `collected`
 * Supports: yaml, json, js
 * @param {String} path
 * @param {Object} collected
 * @param {Object} adapters
 * @returns {Object}
 */
function setSchema(path, collected) {
  var parsedPath = nodePath.parse(path);
  var ext = parsedPath.ext;
  var modelName = parsedPath.name;
  var str;
  if (!ext) return collected;
  if (ext === '.yaml' || ext === '.yml') {
    str = fs.readFileSync(path).toString();
    collected[modelName] = jsyaml.safeLoad(str);
  } else if (ext === '.json' || ext === '.js') {
    collected[modelName] = require(path);
  }
  return collected;
}

function lookUp(path, exclude, collected, fileName) {
  var stat;
  if (!nodePath.isAbsolute(path)) {
    path = process.cwd() + '/' + path;
  }
  stat = fs.statSync(path);
  if (stat.isFile()) {
    return setSchema(path, collected);
  } else if (fileName) {
    if (exclude && exclude.indexOf(fileName) !== -1) {
      return collected;
    }
  }
  return fs.readdirSync(path).reduce(function (obj, fName) {
    obj = lookUp(path + '/' + fName, exclude, obj, fName);
    return obj;
  }, collected);
}

function index(settings) {
  return lookUp(settings.dir, settings.exclude, {});
}

module.exports = index;