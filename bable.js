var babylon = require('babylon');
var util = require('util');

const code = `function square(n) {
    if (true) {
        fs.readDir('.',
            /**
             * Callback
             * @param err
             * @param files
             */
            (err, files) => {
                console.log(files);
            })
    }
}`;

var res = babylon.parse(code);
//console.log(util.inspect(res, {depth: null}));
console.log(JSON.stringify(res));

//console.log(res.tokens.map(token => token.value));
