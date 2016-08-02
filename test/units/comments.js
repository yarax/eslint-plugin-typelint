var grabComments = require('../../lib/comments');
var assert = require('assert');

describe('Comments', () => {
  it.skip('grab', () => {
    var scope = {
      typedVars: []
    };

    var expected = { typedVars:
      [ { varName: 'arg1', varType: 'object', kind: 'primitive' },
        { varName: 'arg1', varType: 'TLTyle1', kind: 'composite' },
        { varName: 'arg2', varType: 'object', kind: 'primitive' },
        { varName: 'arg2', varType: 'TLTyle2', kind: 'composite' },
        { varName: 'arg3', varType: 'object', kind: 'primitive' } ] };

    grabComments({
      leadingComments: [
        {
          value: `/**
* @param {object} arg1 <TLTyle1> description1
* @param {object} arg2 <TLTyle2> description2
* @param {object} arg3 description3
*/`
        }
      ]
    }, scope);

    assert.deepEqual(scope, expected);
  });

  it('grab2', () => {
    var scope = {
      typedVars: []
    };

    grabComments({
      leadingComments: [
        {
          value: `/**
* Test regular function with parameters
* @param man <human>
* @param {Boolean} flag
* @returns {number}
*/`
        }
      ]
    }, scope);

    console.log(scope);
  })
});