var exec = require('child_process').exec;
var assert = require('assert');

const getCmd = (file, config) => {
  if (!config) config = '.eslintrc.yml';
  const cmd = `node ${__dirname}/../node_modules/.bin/eslint -c ${__dirname}/fixtures/${config} ${__dirname}/fixtures/code/${file}.js`;
  console.log(cmd);
  return cmd;
}

describe('typelint', function () {

  it('Run with default config without settings', (done) => {
    exec(getCmd('empty', '.simple.yml'), (err, stdout, stderr) => {
      if (err || stderr) return done(new Error(stdout));
      done();
    });
  });

  it('Regular function comments/variable', (done) => {
    exec(getCmd('test'), (err, stdout, stderr) => {
      if (!err) {
        throw new Error('Should throw error');
      }
      assert(!!stdout.match(/first_Name/), true);
      done();
    });
  });

  it('JSDoc typedef', (done) => {
    exec(getCmd('test'), (err, stdout, stderr) => {
      if (!err) {
        throw new Error('Should throw error');
      }
      assert(!!stdout.match(/first_Name/), true);
      done();
    });
  });

  it.skip('Code in the root scope', (done) => {
    exec(getCmd('root_scope'), (err, stdout, stderr) => {
      if (!err) {
        throw new Error('Should throw error, because wrong member access');
      }
      done();
    });
  });

  it.skip('Transfer variables, should throw', (done) => {
    exec(getCmd('pass_vars'), (err, stdout, stderr) => {
      if (!err) {
        throw new Error('Should throw error, because wrong member access');
      }
      done();
    });
  });

  it('Const definition before arrow function', (done) => {
    exec(getCmd('es6'), (err, stdout, stderr) => {
      if (err || stderr) return done(new Error(stdout));
      done();
    });
  });

  it('Const definition before arrow function', (done) => {
    exec(getCmd('arrays'), (err, stdout, stderr) => {
      if (err || stderr) return done(new Error(stdout));
      done();
    });
  });

  it('Const definition before arrow function', (done) => {
    exec(getCmd('arrays_access'), (err, stdout, stderr) => {
      if (err || stderr) return done(new Error(stdout));
      done();
    });
  });

  it('JSDoc types', (done) => {
    exec(getCmd('jsdoc_types'), (err, stdout, stderr) => {
      if (!err) {
        throw new Error('Should throw error');
      }
      done();
    });
  });

  it('Var reassign', (done) => {
    exec(getCmd('reassign'), (err, stdout, stderr) => {
      if (!err) {
        throw new Error('Should throw error');
      }
      assert(!!stdout.match(/Invalid access to property wrong for type human/), true);
      done();
    });
  });

});