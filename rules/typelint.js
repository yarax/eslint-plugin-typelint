var traverseScope = require('../lib/traverse');
var validation = require('../lib/validation');
var config = require('../lib/config');
var rule;
/**
 * @param {Object} context
 * @param {settings} settings
 * @return {Function}
 */
function handleMemberExpressions(context, settings) {
  return function (node) {
    var scope;
    if (node.object && node.object.name) {
      // memoize settings
      config.settings = settings;
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
            validation.validate(param, scope, node, context);
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