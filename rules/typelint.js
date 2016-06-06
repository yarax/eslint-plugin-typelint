var loadSchemas = require('../lib/load-schemas');
var traverseScope = require('../lib/traverse');
var validateBySchemaConstructor = require('../lib/validation');
var validateBySchema;

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
var a = 0;
module.exports = function (context) {
  console.log(',,,', a);
  if (++a > 3) throw new Error('ok');
  var settings = context.settings.typelint;
  var schemas = loadSchemas(settings);
  var adapters = (settings && settings.adapters) ? settings.adapters.map(function (adapterName) {
    return require('../adapters/' + adapterName);
  }) : [];
  validateBySchema = validateBySchemaConstructor(schemas, adapters);
  return {
    MemberExpression: handleMemberExpressions.bind(null, context),
  };
};