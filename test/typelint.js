var exec = require('child_process').exec;
var assert = require('assert');

const getCmd = (file) => {
  return `node ${__dirname}/../node_modules/.bin/eslint --rulesdir=${__dirname}/../rules/ -c ${__dirname}/fixtures/.eslintrc.yml ${__dirname}/fixtures/${file}.js`;
}

describe('typelint', function () {

  it('Regular function comments/variable', (done) => {
    exec(getCmd('test'), (err, stdout, stderr) => {
      if (err || stderr) return done(new Error(stdout));
      done();
    });
  });

  it('Transfer variables, should throw', (done) => {
    exec(getCmd('test_vars'), (err, stdout, stderr) => {
      if (!err) {
        throw new Error('Should throw error, because wrong member access');
      }
      done();
    });
  });

  it('Const definition before arrow function', (done) => {
    exec(getCmd('test_es6'), (err, stdout, stderr) => {
      if (err || stderr) return done(new Error(stdout));
      done();
    });
  });

  it('Const definition before arrow function', (done) => {
    exec(getCmd('test_arrays'), (err, stdout, stderr) => {
      if (err || stderr) return done(new Error(stdout));
      done();
    });
  });

});