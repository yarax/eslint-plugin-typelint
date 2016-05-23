var schemas;
var adapters;
var fs = require('fs');
var commentable = ['ExpressionStatement', 'VariableDeclaration', 'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'ExportDefaultDeclaration'];
var functinable = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];
var assignable = ['VariableDeclaration'];

function parseComments(commentString) {
  var m = commentString.match(/@param\s*(.*?)\n/g);
  if (m) {
    return m.map(function (paramLine) {
      paramLine = paramLine.replace(/@(param|typedef)\s*/, '').replace(/\{.*?\}/, '');
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
  console.log(node.type, node.leadingComments);
  // Collect all comments with types
  if (/*commentable.indexOf(node.type) !== -1 && */node.leadingComments) {
    var comments = parseComments(node.leadingComments[0].value);
    // @TODO prevent similar typedVars
    scope.typedVars = scope.typedVars.concat(comments);
  }
  // Look up nearest function scope and exit
  if (functinable.indexOf(node.type) !== -1) {
    scope.functionNode = node.body;
  }

  if (scope.typedVars.length && scope.functionNode) {
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
    return require('./models_cache.json');
  } catch(e) {
    return false;
  }
}

function cacheSchema(schema) {
  return fs.writeFileSync(__dirname + '/models_cache.json', JSON.stringify(schema));
}

function loadShemas(settings) {
  if (!settings || !settings.modelsDir) {
    throw new Error('Please provide settings section with models in your eslint config');
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

var start = Date.now();

module.exports = function (context) {
  loadShemas(context.settings);
  return {
    MemberExpression: handleMemberExpressions.bind(null, context)
  };
}