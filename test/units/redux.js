process.env.NODE_ENV = 'production';
var reduxFormater = require('../../lib/schemas/formats/redux');

describe('Reducer', () => {
  it('Reducer', () => {
    reduxFormater({
      reducerPath: '/home/roman/frontend/src/client/redux/typelintReducerWrapper.js'
    });
  });
});