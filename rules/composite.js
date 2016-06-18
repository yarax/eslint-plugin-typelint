var loader = require('../lib/load-schemas');
var traverseScope = require('../lib/traverse');
var validation = require('../lib/validation');
var rule;

/**
 * @param {Object} context
 * @param {String} typeCheckKind primitive|composite
 * @return {Function}
 */
function handleMemberExpressions(context, typeCheckKind) {
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
        scope.typedVars.forEach(function (param) {
          validation.validateBySchema(param, scope, node, context, typeCheckKind);
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
  var settings = context.settings.typelint;
  var schemas = loader.loadComposite(settings);
  var adapters = (settings && settings.adapters) ? settings.adapters.map(function (adapterName) {
    return require('../adapters/' + adapterName);
  }) : [];
  validation.addSchemas('composite', schemas);
  return {
    MemberExpression: handleMemberExpressions(context, 'composite'),
  };
};

rule.handleMemberExpressions = handleMemberExpressions;
module.exports = rule;