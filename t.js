var generate = require('./lib/schemas/generator');
var obj = generate('LOL', {a: {b: [1,2], c: 'erwe'}});
console.log(require('util').inspect(obj, {depth: null}));