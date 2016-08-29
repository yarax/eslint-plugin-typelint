var doctrine = require('doctrine');
var _ = require('lodash');

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

function collectSlicedTypes(item, definedTypes) {
  var isObj = item.type.name.toLowerCase() === 'object';
  if (!isObj && !item.name.match(/\./)) return;
  var accessorArr = item.name.split('.');
  accessorArr.reduce(function (obj, propName, i) {
    if (i === 0) {
      obj[propName] = obj[propName] || {title: propName, properties: {}};
      obj = obj[propName].properties;
    } else {
      if (i !== accessorArr.length - 1 || isObj) {
        obj[propName] = {properties: {}};
        obj = obj[propName].properties;
      } else {
        obj[propName] = {type: item.type.name};
      }
    }
    return obj;
  }, definedTypes);

  return definedTypes;
}

function collectNestedTypes(item, definedTypes) {
  if (item.fields.length) {

  } else {

  }
}

function parseWithDoctrine(commentString) {
  //console.time('doctrine');
  var ast = doctrine.parse(commentString, { unwrap: true });
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
          definedTypes = collectSlicedTypes(item, definedTypes);
          if (item.name.match(/\./)) { // var name contains dot -- this is object type described in JSDoc
            typeObj.varType = item.name;
          } else if (item.type.name.toLowerCase() === 'object') { // no dots, but it's object type
            typeObj.varType = item.name;
          } else {
            typeObj.varType = item.type.name;
          }
        }
        if (item.type.type === 'RecordType') {
          // @TODO varDefinedType
          definedTypes[item.name] = collectNestedTypes(item, definedTypes);
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