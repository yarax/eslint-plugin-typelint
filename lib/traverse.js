var grabComments = require('./comments');

var functinable = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];
var assignable = ['VariableDeclaration'];

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
  }
  return props;
}


function searchForAssignments(node, scope) {
  scope = grabComments(node, scope);
  if (assignable.indexOf(node.type) !== -1) {
    node.declarations.forEach(function (declaration) {
      var fromVar;
      var newVarType;
      var newVar;
      var fromVarProps;
      if (!declaration.init || !declaration.id) return;
      newVar = declaration.id.name;
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
  }
  if (Array.isArray(node.body)) {
    scope = node.body.reduce(function (prevScope, tail) {
      return searchForAssignments(tail, prevScope);
    }, scope);
  }
  return scope;
}

/**
 * Traverses the current scope and collects declarations
 * @param {Object} node
 * @param {Object} scope <scope>
 * @returns {Object} scope
 */
function traverseScope(node, scope) {
  scope = grabComments(node, scope);

  if (functinable.indexOf(node.type) !== -1) {
    scope.functionNode = node.body;
    scope = searchForAssignments(scope.functionNode, scope);
  }

  if (node.type === 'MemberExpression' && node.property) {
    scope.props.push(node.property.name);
  }
  if (node.parent) {
    return traverseScope(node.parent, scope);
  }
  return scope;
}

module.exports = traverseScope;