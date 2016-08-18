var traverseScope = require('../lib/traverse');
var validation = require('../lib/validation');
var rule;
/**
 * @param {Object} context
 * @param {String} typeCheckKind primitive|composite
 * @return {Function}
 */
function handleMemberExpressions(context, settings) {
  return function (node) {
    var scope;
    if (node.object && node.object.name) {

      scope = traverseScope(node, {
        init: {
          start: node.start,
          end: node.end
        },
        props: [],
        typedVars: [],
        nativeVars: [],
      });

      if (scope.props.length && scope.typedVars.length) {
        scope.typedVars.some(function (param) {
          if (param.varName === node.object.name) {
            validation.validate(param, scope, node, context, settings);
            return true;
          }
          return false;
        });
      }
    }
  };
}

/**
 * @param {Object} context
 * @returns {{MemberExpression: (function)}}
 */
rule = function (context) {
  return {
    MemberExpression: handleMemberExpressions(context, context.settings.typelint),
  };
};

rule.handleMemberExpressions = handleMemberExpressions;
module.exports = rule;