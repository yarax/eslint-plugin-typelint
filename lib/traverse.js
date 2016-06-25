var grabComments = require('./comments');

var functinable = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];

/**
 * Traverses the current scope and collects declarations
 * @param {Object} node
 * @param {Object} scope <scope>
 * @returns {Object} scope
 */
function traverseScope(node, scope) {
  if (node.type === 'MemberExpression' && node.property.type === 'Identifier'){
    console.log(node.property);
  }
  scope = grabComments(node, scope);

  if (functinable.indexOf(node.type) !== -1) {
    scope.functionNode = node.body;
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