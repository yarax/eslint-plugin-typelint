var generate = require('../generator');
var nodePath = require('path');
require('babel-register')();

/**
 * @param settings <settings.models.redux>
 */
function redux(settings) {
  // prevent using hot loaders while compiling
  process.env.NODE_ENV = 'production';
  var reducer;
  var path = settings.reducerPath;

  if (!settings.reducerPath) {
    throw new Error('Found typelint models option redux, but there is no reducerPath option inside');
  }

  if (!nodePath.isAbsolute(path)) {
    path = process.cwd() + '/' + path;
  }

  reducer = require(path);
  if (typeof reducer !== 'function') {
    if (typeof reducer.default !== 'function') {
      throw new Error('Reducer must be a function. See more http://redux.js.org/docs/basics/Reducers.html');
    } else {
      reducer = reducer.default;
    }
  }

  return {
    ReduxState: generate(reducer({}, {type: ''}))
  };
}

module.exports = redux;