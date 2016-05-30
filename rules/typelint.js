var loadSchemas = require('../lib/load-schemas');
var traverseScope = require('../lib/traverse');
var validateBySchema = require('../lib/validation');

function handleMemberExpressions(context, node) {
  var scope;
  if (node.object && node.object.name) {
    scope = traverseScope(node, {
      props: [],
      typedVars: [],
      nativeVars: [],
      debug: node.object.name === 'campaignData'
    });

    if (scope.props.length && scope.nativeVars.length &&
      context.settings.typelint && context.settings.typelint.lintNative) {
      scope.nativeVars.forEach(function (param) {
        validateBySchema(param, scope, node, context, true);
      });
    }

    if (scope.props.length && scope.typedVars.length) {
      scope.typedVars.forEach(function (param) {
        validateBySchema(param, scope, node, context, false);
      });
    }
  }
}

module.exports = function (context) {
  loadSchemas(context.settings && context.settings.typelint);
  return {
    MemberExpression: handleMemberExpressions.bind(null, context)
  };
};