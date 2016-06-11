var grabComments = require('./comments');

var functinable = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];
var assignable = ['VariableDeclaration'];

function isVarInScope(varName, scope) {
  var found = null;
  scope.typedVars.some(function (item) {
    var eq = item.varName === varName;
    if (eq) {
      found = item.varType;
    }
    return eq;
  });
  return found;
}

function indexOfVarInScope(varName, scope) {
  var found = -1;
  scope.typedVars.some(function (item, i) {
    var eq = item.varName === varName;
    if (eq) {
      found = i;
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

function checkReAssignments(node, scope) {
  var index;
  if (node.type === 'ExpressionStatement' && node.expression && node.expression.type === 'AssignmentExpression') {
    index = indexOfVarInScope(node.expression.left.name, scope);
    if (index !== -1) {
      scope.typedVars.splice(index, 1);
    }
  }
  return scope;
}

/**
 * Handle assignments of typed vars
 * Goes by each node in function scope
 * @param node
 * @param scope
 * @returns {scope|*}
 */
function searchForAssignments(node, scope) {
  console.log(node.type, node.type === 'VariableDeclaration' && node.declarations[0].id.name);
  // We are at the later point, than initial statement, can't affect, skip
  if (node.start > scope.init.start) {
    return scope;
  }
  scope = grabComments(node, scope);
  scope = checkReAssignments(node, scope);
  if (assignable.indexOf(node.type) !== -1) {
    node.declarations.forEach(function (declaration) {
      var fromVar;
      var newVarType;
      var newVar;
      var fromVarProps;
      if (!declaration.init || !declaration.id) return;
      newVar = declaration.id.name;
      // var newVar = typedVar;
      if (declaration.init.type === 'Identifier') {
        fromVar = declaration.init.name;
        newVarType = isVarInScope(fromVar, scope)
      }
      // var newVar = typedVar.prop1.prop2;
      if (declaration.init.type === 'MemberExpression') {
        fromVar = declaration.init.object.name;
        newVarType = isVarInScope(fromVar, scope);
        if (newVarType) {
          fromVarProps = traverseAllMembers(declaration.init, []);
          newVarType = newVarType + '.' + fromVarProps.join('.');
        }
      }
      if (newVar && newVarType) {
        scope.typedVars.push({
          varName: newVar,
          varType: newVarType
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
    //scope = searchForAssignments(scope.functionNode, scope);
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