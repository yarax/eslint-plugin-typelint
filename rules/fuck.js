/*var a = 0;
module.exports = function(context) {
  return {
    ReturnStatement: function(node) {
      // at a ReturnStatement node while going down
    },
    // at a function expression node while going up:
    "FunctionExpression:exit": checkLastSegment,
    "ArrowFunctionExpression:exit": checkLastSegment,
    "Statement:exit": (node) => {
      //console.log(++a, require('util').inspect(node, {depth: null}));
      console.log(++a, node);
      //console.log(JSON.stringify(node));
    },
    onCodePathStart: function (codePath, node) {
      // at the start of analyzing a code path
    },
    onCodePathEnd: function(codePath, node) {
      // at the end of analyzing a code path
    }
  };
};*/
var a =0;

function prop(node) {
  if (node.type === 'FunctionDeclaration') {
    console.log(node.leadingComments);
  }
  if (node.parent) {
    console.log(node.parent.type, node.parent.property && node.parent.property.name);
    prop(node.parent);
  }
}

module.exports = {
  create: (context) => {
    return {
      MemberExpression: function(node) {
        /*var key = node.key;
        console.log(node.method, node.computed, node.shorthand, key.type, key.value);
        if (!node.method && !node.computed && !node.shorthand && !(key.type === "Literal" && typeof key.value === "string")) {
          context.report(node, "AZAZAZA", {
            property: key.name || key.value
          });
        }*/
        //console.log(++a, require('util').inspect(node, {depth:null}));
        if (node.object && node.object.name === 'fuck') {
          context.report(node, "AZAZAZA");
          prop(node);
        }
        //console.log(++a, );
      }
    };
  }
}