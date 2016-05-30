function grabComments(node, scope) {
  if (node.leadingComments) {
    var complexTypes = parseComplexTypes(node.leadingComments[0].value);
    var nativeTypes = parseNativeTypes(node.leadingComments[0].value);
    // @TODO prevent similar typedVars
    scope.typedVars = scope.typedVars.concat(complexTypes);
    scope.nativeVars = scope.nativeVars.concat(nativeTypes);
  }
  return scope;
}


/**
 * // @TODO move to doctrine
 * @param {String} commentString
 * @returns {Array}
 */
function parseComplexTypes(commentString) {
  var typedComments = commentString.match(/@(param|var|member)\s*(.*?)\n/g);
  if (typedComments) {
    return typedComments.map(function (paramLine) {
      paramLine = paramLine.replace(/@(param|var|member)\s*/, '').replace(/\{.*?\}/, '');
      var ms = paramLine.trim().split(' ');
      var varName = ms[0];
      if (!ms[1]) return null;
      var m2 = ms[1].match(/\<(.*?)\>/);
      if (m2) {
        return {
          varName: varName,
          type: m2[1]
        }
      } else {
        return null;
      }
    }).filter(function (comment) {
      return comment;
    });
  } else {
    return [];
  }
}


function parseNativeTypes(commentString) {
  //return [];
  var nativeTypes = commentString.match(/@(param|var|member)\s*\{(.*?)\}\s*([a-zA-Z0-9_]+)/g);
  if (nativeTypes) {
    return nativeTypes.map(function (paramLine) {
      var m2 = paramLine.match(/@(param|var|member)\s*\{(.*?)\}\s*([a-zA-Z0-9_]+)/);
      if (m2) {
        return {
          varName: m2[3],
          type: m2[2]
        }
      } else {
        return null;
      }
    }).filter(function (comment) {
      return comment;
    });
  } else {
    return [];
  }
}

module.exports = grabComments;