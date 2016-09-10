var doctrine = require('doctrine');
var jsdoc = require('./types/jsdoc');
var _ = require('lodash');

function getTypeLintType(description) {
  if (!description) return null;
  var m = description.match(/<(.*?)>/);
  return m ? m[1] : null;
}

function parseWithDoctrine(commentString) {
  //console.time('doctrine');
  var ast = doctrine.parse(commentString, { unwrap: true });
  //assert.equal(scope.typedVars[0].varDefinedType.varname.properties.b.c, 'str
  var definedTypes = {};
  //console.timeEnd('doctrine');
  return ast.tags
    .filter(function (tag) {
    return tag.title === 'param';
  })
    .reduce(function (allItems, item) {
      var typeObj = {
        varName: item.name,
        definedTypes: definedTypes
      };
      if (item.type) {
        // consider nested
        if (item.type.type === 'NameExpression') {
          // collecting object types properties
          definedTypes = jsdoc.collectSlicedTypes(item, definedTypes);
          if (item.name.match(/\./)) { // var name contains dot -- this is object type described in JSDoc
            typeObj.varType = item.name;
          } else if (item.type.name.toLowerCase() === 'object') { // no dots, but it's object type
            typeObj.varType = item.name;
          } else {
            typeObj.varType = item.type.name;
          }
        }
        if (item.type.type === 'RecordType' || item.type.type === 'ArrayType') {
          typeObj.varDefinedType = jsdoc.buildObjectType(item.type);
        }
        if (item.type.type === 'UnionType') {
          typeObj.unions = jsdoc.getAllUnions(item.type.elements);
        }

        allItems.push(typeObj);
      }
      var tlt = getTypeLintType(item.description);
      if (tlt) {
        allItems.push({
          varName: item.name,
          varType: tlt,
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
  if (node.leadingComments) {
    scope.typedVars = scope.typedVars.concat(parseWithDoctrine(node.leadingComments[0].value));
  }
  return scope;
}

module.exports = grabComments;