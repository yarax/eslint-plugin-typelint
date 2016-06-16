var loadSchemas = require('../lib/load-schemas');
var traverseScope = require('../lib/traverse');
var validateBySchemaConstructor = require('../lib/validation');
var rule;

/**
 * @param {Function} validateBySchema
 * @param {Object} context
 * @param {Boolean} checkNativeTypes
 * @return {Function}
 */
function handleMemberExpressions(validateBySchema, context, checkNativeTypes) {
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
          if (!checkNativeTypes && param.format === 'native') return;
          validateBySchema(param, scope, node, context, param.format);
        });
      }
    }
  }
}

/**
 * @param {Object} context
 * @returns {{MemberExpression: (function)}}
 */
rule = function (context) {
  var settings = context.settings.typelint;
  var schemas = loadSchemas(settings);
  var adapters = (settings && settings.adapters) ? settings.adapters.map(function (adapterName) {
    return require('../adapters/' + adapterName);
  }) : [];
  var validateBySchema = validateBySchemaConstructor(schemas, adapters);
  return {
    MemberExpression: handleMemberExpressions(validateBySchema, context, false),
  };
};

rule.handleMemberExpressions = handleMemberExpressions;
module.exports = rule;