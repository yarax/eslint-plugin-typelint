var schemas;
var adapters;
var fs = require('fs');
var nodePath = require('path');
var commentable = ['VariableDeclaration', 'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'ExportDefaultDeclaration'];
var functinable = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];
var assignable = ['VariableDeclaration'];
var allowedForArray = Object.getOwnPropertyNames(Array.prototype);


function parseNativeTypes(commentString) {
  return [];
  var matchRegExp = new RegExp('@(param|var|member)\\\s*(\{.*?\})\\\s*([a-zA-Z0-9_]+)', 'g');
  var nativeTypes = commentString.match(matchRegExp);
  if (nativeTypes) {
    return nativeTypes.map(function (paramLine) {
      var m2 = paramLine.match(matchRegExp);
      if (m2) {
        return {
          varName: varName,
          type: m2[1]
        }
      } else {
        return null;
      }
    }).filter(function (comment) {
      return comment;
    });
  } else {
    return [];
  }
}

/**
 * // @TODO move to doctrine
 * @param {String} commentString
 * @returns {Array}
 */
function parseComplexTypes(commentString) {
  var typedComments = commentString.match(/@(param|var|member)\s*(.*?)\n/g);
  if (typedComments) {
    return typedComments.map(function (paramLine) {
      paramLine = paramLine.replace(/@(param|var|member)\s*/, '').replace(/\{.*?\}/, '');
      var ms = paramLine.trim().split(' ');
      var varName = ms[0];
      if (!ms[1]) return null;
      var m2 = ms[1].match(/\<(.*?)\>/);
      if (m2) {
        return {
          varName: varName,
          type: m2[1]
        }
      } else {
        return null;
      }
    }).filter(function (comment) {
      return comment;
    });
  } else {
    return [];
  }
}

/**
 * Recursively get all members
 * @param node
 * @param props
 * @returns {*}
 */
function traverseAllMembers(node, props) {
  if (node.type === 'MemberExpression' && node.property) {
    props.push(node.property.name);
  }
  if (node.parent) {
    return traverseAllMembers(node.parent, props);
  } else {
    return props;
  }
}

function typeOfVarInScope(varName, scope) {
  var found = null;
  scope.typedVars.some(function (item) {
    var eq = item.varName === varName;
    if (eq) {
      found = item.type;
    }
    return eq;
  });
  return found;
}

function searchForAssignments(node, scope) {
  scope = grabComments(node, scope);
  if (assignable.indexOf(node.type) !== -1) {
    //searchForAssignments(require('util').inspect(node.body, {depth: 5}));
    node.declarations.forEach(function (declaration) {
      var fromVar;
      var newVarType;
      var fromVarProps;
      if (!declaration.init || !declaration.id) return;
      var newVar = declaration.id.name;
      if (declaration.init.type === 'Identifier') {
        fromVar = declaration.init.name;
        newVarType = typeOfVarInScope(fromVar, scope)
      }
      if (declaration.init.type === 'MemberExpression') {
        fromVar = declaration.init.object.name;
        newVarType = typeOfVarInScope(fromVar, scope);
        if (newVarType) {
          fromVarProps = traverseAllMembers(declaration.init, []);
          newVarType = newVarType + '.' + fromVarProps.join('.');
        }
      }
      if (newVar && newVarType) {
        scope.typedVars.push({
          varName: newVar,
          type: newVarType
        });
      }
    });
    return scope;
  } else {
    if (Array.isArray(node.body)) {
      scope = node.body.reduce(function (prevScope, tail) {
        return searchForAssignments(tail, prevScope);
      }, scope);
    }
    return scope;
  }
}

function grabComments(node, scope) {
  if (node.leadingComments) {
    var complexTypes = parseComplexTypes(node.leadingComments[0].value);
    var nativeTypes = parseNativeTypes(node.leadingComments[0].value);
    // @TODO prevent similar typedVars
    scope.typedVars = scope.typedVars.concat(complexTypes);
    scope.nativeVars = scope.nativeVars.concat(nativeTypes);
  }
  return scope;
}

/**
 *
 * @param node
 * @param scope
 * @returns {Object} scope {typedVars: [{varName: 'a', type: 'user'}, {..}], props: ['a', 'b']}
 */
function traverseScope(node, scope) {
  // Collect all comments with types
  scope = grabComments(node, scope);
  if (functinable.indexOf(node.type) !== -1) {
    scope.functionNode = node.body;
    scope = searchForAssignments(scope.functionNode, scope);
  }

  if (node.type === 'MemberExpression' && node.property) {
    scope.props.push(node.property.name);
  }
  // If global scope
  if (node.parent) {
    return traverseScope(node.parent, scope);
  } else {
    return scope;
  }
}


function adaptProp(prop) {
  return adapters.reduce(function (prev, adaptfunc) {
    return adaptfunc(prev);
  }, prop);
}

function validateAccess(props, schema, i) {
  if (!props[i]) return null;
  var schemaProp = adaptProp(props[i]);
  // access to Array methods and properties
  // @TODO implement access by indexes
  if (!schema.properties && schema.items) {
    if (allowedForArray.indexOf(props[i]) === -1) {
      if (schema.items.properties && schema.items.properties[schemaProp]) return null;
      else return props[i];
    }
    return null;
  }
  if (schema.properties[schemaProp]) {
    return validateAccess(props, schema.properties[schemaProp], i + 1);
  } else {
    return props[i];
  }
}

function collectAllSchemas(path, collected) {
  if (!nodePath.isAbsolute(path)) {
    path = process.cwd() + '/' + path;
  }
  var stat = fs.statSync(path);
  if (stat.isFile()) {
    return setSchema(path, collected);
  }
  return fs.readdirSync(path).reduce(function (obj, file) {
    obj = collectAllSchemas(path + '/' + file, obj);
    return obj;
  }, collected);
}

function setSchema(path, prev) {
  var m = path.match(/\/([^\/]+)$/);
  var file = m[1];
  var ext = file.match(/\.([a-zA-Z0-9]+)$/);
  if (!ext) return prev;
  ext = ext[0];
  var modelName = file.replace(ext, '');
  if (ext === '.yaml' || ext === '.yml') {
    var str = fs.readFileSync(path).toString();
    prev[modelName] = require('js-yaml').safeLoad(str);
  } else if (ext === '.json' || ext === '.js') {
    prev[modelName] = require(path);
  }
  return prev;
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

function loadShemas(settings) {
  if (!settings || !settings.modelsDir) {
    throw new Error('Please provide settings.typelint section with models in your eslint config');
  }
  adapters = settings.adapters.map(function (adapterName) {
    return require('../adapters/' + adapterName)
  });
  if (settings.useCache) {
    schemas = getFromCache() || cacheSchema(collectAllSchemas(settings.modelsDir, {}));
  } else {
    schemas = collectAllSchemas(settings.modelsDir, {});
  }
}

/**
 * type can be with dots
 * @param type
 */
function getSchemaByType(type) {
  if (type.match(/\./)) {
    var props = type.split('.');
    var schemaObj = schemas[props[0]];
    for(var i = 1; i < props.length; i++) {
      if (!schemaObj.properties || !schemaObj.properties[props[i]]) {
        throw new Error("Can't access to schema " + props[0] + " with path " + type);
      }
      schemaObj = schemaObj.properties[props[i]];
    }
    return schemaObj;
  } else {
    return schemas[type];
  }
}

function handleMemberExpressions(context, node) {
  if (node.object && node.object.name) {
    var scope = traverseScope(node, {
      props: [],
      typedVars: [],
      nativeVars: [],
      debug: node.object.name === 'campaignData'
    });
    
    if (scope.props.length && scope.nativeVars.length &&
      context.settings.typelint && context.settings.typelint.lintNative) {
      scope.nativeVars.forEach(function (nativeVar) {

      });
    }
    
    if (scope.props.length && scope.typedVars.length) {
      scope.typedVars.forEach(function (param) {
        if (param.varName !== node.object.name) return;
        try {
          var schema = getSchemaByType(param.type);
        } catch (e) {
          context.report(node, e.message);
          return;
        }
        if (!schema) {
          context.report(node, 'Unknown schema and object type ' + param.type);
          return;
        }
        if (!schema.properties) {
          context.report(node, 'Type ' + param.type + ' has no properties. Trying to access "' + scope.props.join('.') + '"');
          return;
        }
        var valid = validateAccess(scope.props, schema, 0);
        if (valid !== null) {
          context.report(node, 'Invalid access to property ' + valid + ' for type ' + param.type);
        }
      });
    }
  }
}

module.exports = function (context) {
  loadShemas(context.settings && context.settings.typelint);
  return {
    MemberExpression: handleMemberExpressions.bind(null, context)
  };
}