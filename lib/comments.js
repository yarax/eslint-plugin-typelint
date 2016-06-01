/**
 * Parse TypeLint types
 * // @TODO move to doctrine
 * @param {String} commentString
 * @returns {Array}
 */
function parseComplexTypes(commentString) {
  var typedComments = commentString.match(/@(param|var|member)\s*(.*?)\n/g);
  if (typedComments) {
    return typedComments.map(function (paramLine) {
      var ms, varName, m2;
      paramLine = paramLine.replace(/@(param|var|member)\s*/, '').replace(/\{.*?\}/, '');
      ms = paramLine.trim().split(' ');
      varName = ms[0];
      if (!ms[1]) return null;
      m2 = ms[1].match(/<(.*?)>/);
      if (m2) {
        return {
          varName: varName,
          type: m2[1]
        };
      }
      return null;
    }).filter(function (comment) {
      return comment;
    });
  }
  return [];
}

/**
 * Parse JSDoc types
 * @param {String} commentString
 * @returns {*}
 */
function parseNativeTypes(commentString) {
  var nativeTypes = commentString.match(/@(param|var|member)\s*\{(.*?)\}\s*([a-zA-Z0-9_]+)/g);
  if (nativeTypes) {
    return nativeTypes.map(function (paramLine) {
      var m2 = paramLine.match(/@(param|var|member)\s*\{(.*?)\}\s*([a-zA-Z0-9_]+)/);
      if (m2) {
        return {
          varName: m2[3],
          type: m2[2]
        };
      }
      return null;
    }).filter(function (comment) {
      return comment;
    });
  }
  return [];
}

/**
 * Handle nodes with leadingComments
 * @param {Object} node
 * @param {Object} scope <scope>
 * @returns scope
 */
function grabComments(node, scope) {
  var complexTypes;
  var nativeTypes;
  if (node.leadingComments) {
    complexTypes = parseComplexTypes(node.leadingComments[0].value);
    nativeTypes = parseNativeTypes(node.leadingComments[0].value);
    // @TODO prevent similar typedVars
    scope.typedVars = scope.typedVars.concat(complexTypes);
    scope.nativeVars = scope.nativeVars.concat(nativeTypes);
  }
  return scope;
}

module.exports = grabComments;