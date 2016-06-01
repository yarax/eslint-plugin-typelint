var nodePath = require('path');
var jsyaml = require('js-yaml');

/**
 * Preparing models
 * @param {Object} settings <settings>
 */
function loadShemas(settings) {
  var schemas;
  if (!settings || !settings.modelsDir) {
    throw new Error('Please provide settings.typelint section with models in your eslint config');
  }
  if (settings.useCache) {
    schemas = getFromCache() || cacheSchema(collectAllSchemas(settings.modelsDir, {}));
  } else {
    schemas = collectAllSchemas(settings.modelsDir, {});
  }

  return schemas;
}

/**
 * Recursively collects models
 * @param {String} path
 * @param {Object} collected key-value dictionary
 * @param {Object} settings <settings>
 * @param {String} fileName current file name
 * @returns {*}
 */
function collectAllSchemas(path, collected, settings, fileName) {
  if (!nodePath.isAbsolute(path)) {
    path = process.cwd() + '/' + path;
  }
  var stat = fs.statSync(path);
  if (stat.isFile()) {
    return setSchema(path, collected);
  } else if (fileName) {
    if (settings.excludeModelDirs && settings.excludeModelDirs.indexOf(fileName) !== -1) {
      return collected;
    }
  }
  return fs.readdirSync(path).reduce(function (obj, fileName) {
    obj = collectAllSchemas(path + '/' + fileName, obj, settings, fileName);
    return obj;
  }, collected);
}

/**
 * Handles certain file path and populates `collected`
 * Supports: yaml, json, js
 * @param {String} path
 * @param collected
 * @returns {Object}
 */
function setSchema(path, collected) {
  var parsedPath = nodePath(path);
  var ext = parsedPath.ext;
  if (!ext) return collected;
  var modelName = parsedPath.name;
  if (ext === '.yaml' || ext === '.yml') {
    var str = fs.readFileSync(path).toString();
    collected[modelName] = jsyaml.safeLoad(str);
  } else if (ext === '.json' || ext === '.js') {
    collected[modelName] = require(path);
  }
  return collected;
}

function getFromCache() {
  try {
    return require('../cache/models.json');
  } catch(e) {
    return false;
  }
}

function cacheSchema(schema) {
  return fs.writeFileSync(__dirname + '/../cache/models.json', JSON.stringify(schema));
}

module.exports = loadShemas;