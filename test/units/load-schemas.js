var json = require('../../lib/schemas/formats/json');
var assert = require('assert');

describe('Schema loaders', function () {
  
  it('JSON schema load directory', function () {
    var settings = {
      dir: './test/fixtures/models',
      exclude: 'wrong_dir'
    };
    var schemas = json(settings);
    assert.equal(typeof schemas.human, 'object');
    assert.equal(typeof schemas.human2, 'object');
    assert.equal(typeof schemas.wrong, 'undefined');
  });
  
});