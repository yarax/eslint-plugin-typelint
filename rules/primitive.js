var composite = require('./composite');
var loader = require('../lib/schemas/load');
var validation = require('../lib/validation');
/**
 * @param {Object} context
 * @returns {{MemberExpression: (function)}}
 */
var rule = function (context) {
  var schemas = loader.loadPrimitive();
  validation.addSchemas('primitive', schemas);
  return {
    MemberExpression: composite.handleMemberExpressions(context, 'primitive'),
  };
};

module.exports = rule;