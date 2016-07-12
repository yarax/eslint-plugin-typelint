/* eslint-disable  import/no-unresolved */
var nodePath = require('path');
var fs = require('fs');

function getFromCache() {
  try {
    return require('../../cache/models.json');
  } catch (e) {
    return false;
  }
}

function cacheSchema(schema) {
  return fs.writeFileSync(__dirname + '/../cache/models.json', JSON.stringify(schema));
}

/**
 * Get all kind of schemas
 * @param settings
 * @returns {Object} collected schemas key-value
 */
function collectAllSchemas(settings) {
  var schemas = {};
  if (settings.json) {
    schemas = require('./formats/json')(settings.json);
  }
  if (settings.adapters) {
    settings.adapters.forEach(function (adapter) {
      if (!nodePath.isAbsolute(adapter)) {
        adapter = process.cwd() + '/' + adapter;
      }
      schemas = require(adapter)(schemas);
    });
  }
  return schemas;
}

/**
 * Preparing models
 * @param {Object} settings <settings>
 */
function loadComposite(settings) {
  var schemas;
  if (!settings || !settings.models) {
    throw new Error('Please provide settings.typelint.models section in your eslint config');
  }
  if (settings.useCache) {
    schemas = getFromCache() || cacheSchema(collectAllSchemas(settings.models));
  } else {
    schemas = collectAllSchemas(settings.models);
  }

  return schemas;
}

function loadPrimitive() {
  var wrap = function (props) {
    return {
      type: 'object',
      properties: props.reduce(function (prev, prop) {
        prev[prop] = 'string';
        return prev;
      }, {})
    };
  };
  return {
    string: wrap(Object.getOwnPropertyNames(String.prototype)),
    array: wrap(Object.getOwnPropertyNames(Array.prototype)),
    number: wrap(Object.getOwnPropertyNames(Number.prototype)),
    object: wrap(Object.getOwnPropertyNames(Object.prototype)),
    boolean: wrap(Object.getOwnPropertyNames(Boolean.prototype)),
  };
}

module.exports = {
  loadPrimitive: loadPrimitive,
  loadComposite: loadComposite,
};