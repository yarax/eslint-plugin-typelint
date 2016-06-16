var composite = require('./composite');
var validateBySchemaConstructor = require('../lib/validation');
/**
 * @param {Object} context
 * @returns {{MemberExpression: (function)}}
 */
var rule = function (context) {
  var validateBySchema = validateBySchemaConstructor({}, []);
  return {
    MemberExpression: composite.handleMemberExpressions(validateBySchema, context, false),
  };
};

module.exports = rule;