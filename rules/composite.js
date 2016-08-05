var traverseScope = require('../lib/traverse');
var validation = require('../lib/validation');
var rule;
console.log('LOAD ALL', Date.now());
/**
 * @param {Object} context
 * @param {String} typeCheckKind primitive|composite
 * @return {Function}
 */
function handleMemberExpressions(context, typeCheckKind) {
  return function (node) {
    console.log('handleMemberExpressions');
    throw new Error();
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
            validation.validateBySchema(param, scope, node, context, typeCheckKind);
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
  validation.addSettings(context.settings.typelint);
  return {
    MemberExpression: handleMemberExpressions(context, 'composite'),
  };
};

rule.handleMemberExpressions = handleMemberExpressions;
module.exports = rule;