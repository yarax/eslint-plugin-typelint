var models = {
    human: {
        "title": "Human",
        "type": "object",
        "properties": {
            "firstName": {
                "type": "string"
            },
            "lastName": {
                "type": "string"
            },
            "age": {
                "description": "Age in years",
                "type": "integer",
                "minimum": 0
            }
        },
        "required": ["firstName", "lastName"]
    }
};

var fs = require('fs');
require('jsdoc/jsdoc');
var fileName = './test.js';
var fileStr = fs.readFileSync(fileName).toString();
var nodes = global.app.jsdoc.parser.parse(fileName, 'utf-8');
//console.log(require('util').inspect(nodes, {depth: null}));
nodes.forEach((node) => {
    if (node.params) {
        var typedParams = node.params.reduce((params, param) => {
            var m = param.description.match(/\[(.*?)\]/);
            if (!m) return params;
            var typeParam = m[1];
            if (models[typeParam]) {
                params.push(param.name);
            }
            return params;
        }, []);
        var func = fileStr.substr(node.meta.range[0], node.meta.range[1]);
        typedParams.forEach((param) => {
            var reg = new RegExp(param + '[\\\.\\\[\\\]]+[\\\da-zA-Z_]*', 'ig');
            console.log(reg);
            var res = func.match(reg);
            console.log(res);
        });

    }
});

//var parser = require('./node_modules/jsdoc/lib/jsdoc/src/parser');
//var res = parser.parse('./test.js', 'utf-8');
//console.log(global.app);