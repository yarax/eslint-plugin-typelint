var schemas;
var fs = require('fs');

function parseComments(commentString) {
  var m = commentString.match(/@param\s*(.*?)\n/g);
  if (m) {
    return m.map(function (paramLine) {
      paramLine = paramLine.replace(/@param\s*/, '').replace(/\{.*?\}/, '');
      var ms = paramLine.trim().split(' ');
      var varName = ms[0];
      if (!ms[1]) return null;
      var m2 = ms[1].match(/\[(.*?)\]/);
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
    return null;
  }
}

function traverseScope(node, scope) {
  if (node.type === 'FunctionDeclaration' && node.leadingComments) {
    scope.typedVars = parseComments(node.leadingComments[0].value);
  }

  if (node.type === 'MemberExpression' && node.property) {
    scope.props.push(node.property.name);
  }

  if (node.parent) {
    console.log(node.parent.type, node.parent.property && node.parent.property.name);
    return traverseScope(node.parent, scope);
  } else {
    return scope;
  }
}


function validateAccess(props, schema, i) {
  if (!props[i]) return null;
  if (schema.properties[props[i]]) {
    return validateAccess(props, schema.properties[props[i]], i+1);
  } else {
    return props[i];
  }
}

function lookUpConfig(dir) {
  var found = fs.readdirSync(dir).some(function (file) {
    return !!file.match(/eslintrc/);
  });
  if (found) return dir;
  else return lookUpConfig + '/..';
}

function loadShemas(settings) {
  if (!settings) {
    throw new Error('Please provide settings section with models in your eslint config');
  }
  var modelsDir = lookUpConfig(__dirname + '/..') + '/' + settings.modelsDir;
  schemas = fs.readdirSync(modelsDir).reduce(function (prev, file) {
    var modelName = file.replace(/\.[a-zA-Z]+$/, '');
    prev[modelName] = require(modelsDir + '/' + file);
    return prev;
  }, {});
}

module.exports = {
  create: (context) => {
    loadShemas(context.settings);
    return {
      MemberExpression: function(node) {
        if (node.object && node.object.name) {
          var scope = traverseScope(node, {
            props: [],
          });

          if (scope.props.length && scope.typedVars) {
            scope.typedVars.forEach(function (param) {
              if (param.varName !== node.object.name) return;
              var schema = schemas[param.type];
              var valid = validateAccess(scope.props, schema, 0);
              if (valid !== null) {
                context.report(node, 'Invalid access to property ' + valid + ' in variable');
              }
            });
          }
        }
      }
    };
  }
}