var doctrine = require('doctrine');
var primitiveTypes = require('./schemas/load').loadPrimitive();

function getKindOfType(typeName) {
  if (!typeName) return 'composite';
  if (primitiveTypes[typeName.toLowerCase()]) {
    return 'primitive';
  }
  return 'composite';
}

function getTypeLintType(description) {
  if (!description) return null;
  var m = description.match(/<(.*?)>/);
  return m ? m[1] : null;
}

function getAllUnions(elements) {
  return elements.reduce(function (all, item) {
    if (item.type === 'UnionType') {
      all = all.concat(getAllUnions(item.elements));
    } else if (item.type === 'NameExpression') {
      all.push(item.name);
    } else {
      console.log('Unknown type' + item.type);
    }
    return all;
  }, []);
}

function parseWithDoctrine(commentString) {
  //console.time('doctrine');
  var ast = doctrine.parse(commentString, { unwrap: true });
  //console.timeEnd('doctrine');
  return ast.tags
    .filter(function (tag) {
    return tag.title === 'param';
  })
    .reduce(function (allItems, item) {
      var typeObj = {
        kind: getKindOfType(item.type.name),
        varName: item.name
      };
      if (item.type) {
        if (item.type.type === 'NameExpression') {
          typeObj.varType = item.type.name;
        }
        if (item.type.type === 'UnionType') {
          typeObj.unions = getAllUnions(item.type.elements);
        }

        allItems.push(typeObj);
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