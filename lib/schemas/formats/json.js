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

/**
 * Wrap schema with adapters
 * @param schema {Object}
 * @param adapters <settings.models.json.adapters>
 */
function applyAdapters(schema, adapters) {
  if (adapters) {
    adapters.forEach(function (adapter) {
      if (!nodePath.isAbsolute(adapter)) {
        adapter = process.cwd() + '/' + adapter;
      }
      schema = require(adapter)(schema);
    });
  }
  return schema;
}

function index(settings) {
  var schema = lookUp(settings.dir, settings.exclude, {});
  return applyAdapters(schema, settings.adapters);
}

module.exports = index;