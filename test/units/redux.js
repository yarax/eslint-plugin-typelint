process.env.NODE_ENV = 'production';
var assert = require('assert');
var reduxFormater = require('../../lib/schemas/formats/redux');

describe('Reducer', () => {
  it('Reducer', function() {
    this.timeout(0);
    var schema = reduxFormater({
      reducerPath: __dirname + '/../fixtures/redux/reducer'
    });
    assert.equal(schema.ReduxState.properties.test2.properties.prop33.type, 'number');
  });
});