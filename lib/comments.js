var doctrine = require('doctrine');
var primitiveTypes = require('./schemas/load').loadPrimitive();
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
          varType: m2[1],
          kind: 'composite'
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
          varType: m2[2],
          kind: 'primitive'
        };
      }
      return null;
    }).filter(function (comment) {
      return comment;
    });
  }
  return [];
}

function getKindOfType(typeName) {
  if (primitiveTypes[typeName.toLowerCase()]) {
    return 'primitive';
  }
  return 'composite';
}

function getTypeLintType(description) {
  var m = description.match(/<(.*?)>/);
  return m ? m[1] : null;
}

function parseWithDoctrine(commentString) {
  //console.time('doctrine');
  var ast = doctrine.parse(commentString);
  //console.timeEnd('doctrine');
  return ast.tags
    .filter(function (tag) {
    return tag.title === 'param';
  })
    .reduce(function (allItems, item) {
      if (item.type && item.type.name) {
        allItems.push({
          varName: item.name,
          varType: item.type.name,
          kind: getKindOfType(item.type.name)
        });
      }
      var tlt = getTypeLintType(item.description);
      if (tlt) {
        allItems.push({
          varName: item.name,
          varType: tlt,
          kind: 'composite'
        });
      }
      return allItems;
    }, []);
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
    scope.typedVars = parseWithDoctrine(node.leadingComments[0].value);
    //complexTypes = parseComplexTypes(node.leadingComments[0].value);
    //nativeTypes = parseNativeTypes(node.leadingComments[0].value);
    // @TODO prevent similar typedVars
    //scope.typedVars = scope.typedVars.concat(complexTypes).concat(nativeTypes);
  }
  return scope;
}

module.exports = grabComments;