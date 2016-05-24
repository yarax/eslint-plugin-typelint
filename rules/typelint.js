/**
 * @TODO don't collect wrong assignments
 **/
var schemas;
var adapters;
var fs = require('fs');
var nodePath = require('path');
var commentable = ['VariableDeclaration', 'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'ExportDefaultDeclaration'];
var functinable = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];
var assignable = ['VariableDeclaration'];

function parseComments(commentString) {
  var m = commentString.match(/@param\s*(.*?)\n/g);
  if (m) {
    return m.map(function (paramLine) {
      paramLine = paramLine.replace(/@param\s*/, '').replace(/\{.*?\}/, '');
      var ms = paramLine.trim().split(' ');
      var varName = ms[0];
      if (!ms[1]) return null;
      var m2 = ms[1].match(/\[(.*?)\]/);
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
    return null;
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
          newVarType = typeOfVarInScope(fromVar, scope);
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

/**
 *
 * @param node
 * @param scope
 * @returns {Object} scope {typedVars: [{varName: 'a', type: 'user'}, {..}], props: ['a', 'b']}
 */
function traverseScope(node, scope) {
  // Collect all comments with types
  if (node.leadingComments) {
    var comments = parseComments(node.leadingComments[0].value);
    // @TODO prevent similar typedVars
    if (comments) {
      scope.typedVars = scope.typedVars.concat(comments);
    }
  }
  // Look up nearest function scope and exit
  if (functinable.indexOf(node.type) !== -1) {
    scope.functionNode = node.body;
  }

  if (scope.functionNode && scope.typedVars) {
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
  if (schema.properties[schemaProp]) {
    return validateAccess(props, schema.properties[schemaProp], i + 1);
  } else {
    return props[i];
  }
}
function collectAllSchemas(path, collected, settings, fileName) {
  if (!nodePath.isAbsolute(path)) {
    path = process.cwd() + '/' + path;
  }
  var stat = fs.statSync(path);
  if (stat.isFile()) {
    return setSchema(path, collected, fileName);
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
    schemas = getFromCache() || cacheSchema(collectAllSchemas(settings.modelsDir, {}, settings));
  } else {
    schemas = collectAllSchemas(settings.modelsDir, {}, settings);
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
    return props.reduce(function (prev, prop) {
      if (!prev.properties || !prev.properties[prop]) {
        throw new Error("Can't access to schema " + props[0] + " with path " + type);
      }
      prev = prev.properties[prop];
      return prev;
    }, schemaObj);
  } else {
    return schemas[type];
  }
}

function handleMemberExpressions(context, node) {
  if (node.object && node.object.name) {
    var scope = traverseScope(node, {
      props: [],
      typedVars: []
    });
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