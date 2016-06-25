var toCamel = require('../../middlewares/to-camel-case');
var toSnake = require('../../middlewares/to-snake-case');
var json = require('../fixtures/cached-models.json');
var assert = require('assert');

describe('Adapters', function () {

  it('To camel case adapter', function () {
    var newObj = toCamel(json);
    assert.equal(!!newObj.movie.properties.proCreators, true);
    assert.equal(!!newObj.movie.properties.proCreators.properties.proDirector, true);
    assert.equal(!!newObj.scope.properties.oddProps, true);
  });

  it('To snake case adapter', function () {
    var newObj = toSnake(json);
    assert.equal(!!newObj.scope.properties.typed_vars, true);
    assert.equal(!!newObj.var.properties.var_name, true);
  });

});