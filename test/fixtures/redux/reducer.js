var combineReducers = require('redux').combineReducers;

var initialState1 = {
  prop1: [],
  prop2: '',
  prop3: 0
}

var initialState2 = {
  prop11: [],
  prop22: '',
  prop33: 0
}


function test1(state, action) {
  return initialState1;
}

function test2(state, action) {
  return initialState2;
}

module.exports = combineReducers({
  test1,
  test2
})