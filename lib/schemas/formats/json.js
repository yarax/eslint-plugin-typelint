/* eslint-disable  import/no-unresolved */
var nodePath = require('path');
var jsyaml = require('js-yaml');
var fs = require('fs');

/**
 * Reads yaml or js/json files and return js object
 * @param {String} path
 * @returns {Object}
 */
function getContentByPath(path) {
  var parsedPath = nodePath.parse(path);
  var ext = parsedPath.ext;
  var str;
  if (ext === '.yaml' || ext === '.yml') {
    str = fs.readFileSync(path).toString();
    return jsyaml.safeLoad(str);
  } else if (ext === '.json' || ext === '.js') {
    return require(path);
  }
}

/**
 * Handles certain file path and populates `collected`
 * Supports: yaml, json, js
 * @param {String} path
 * @param {Object} collected
 * @returns {Object}
 */
function setSchema(path, collected) {
  var parsedPath = nodePath.parse(path);
  var ext = parsedPath.ext;
  var modelName = parsedPath.name;
  if (!ext) return collected;
  collected[modelName] = getContentByPath(path);
  return collected;
}

function getAbsolutePath(path) {
  return nodePath.isAbsolute(path) ? path : process.cwd() + '/' + path;
}

function lookUp(path, exclude, collected, fileName) {
  var stat;
  path = getAbsolutePath(path);
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

function readSwagger(path) {
  path = getAbsolutePath(path);
  var swaggerConfig = getContentByPath(path);
  if (!swaggerConfig.definitions) {
    throw new Error('Was not found "definitions" section in swagger config by path ' + path);
  }
  return swaggerConfig.definitions;
}

function index(settings) {
  if (settings.dir) {
    var schema = lookUp(settings.dir, settings.exclude, {});
    return applyAdapters(schema, settings.adapters);
  } else if (settings.swagger) {
    return readSwagger(settings.swagger);
  } else {
    throw new Error ('In typelint.models.json section in eslint config should be either "dir" or "swagger" option');
  }
}

module.exports = index;