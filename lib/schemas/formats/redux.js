var generate = require('../generator');
var nodePath = require('path');
/**
 * @param settings <settings.models.redux>
 */
function redux(settings) {
  var reducer;
  var babelOptions;
  var path = settings.reducerPath;

  if (!settings.reducerPath) {
    throw new Error('Found typelint models option redux, but there is no reducerPath option inside');
  }

  if (!nodePath.isAbsolute(path)) {
    path = process.cwd() + '/' + path;
  }

  //babelOptions = require('../../helpers/babelrc')(path);
  require('babel-register')({
    presets: ['es2015', 'stage-0']
  });
  //console.log(babelOptions, path);
  reducer = require(path);
  throw new Error(435);

  return {
    ReduxState: generate(reducer)
  };
}

module.exports = redux;