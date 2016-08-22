module.exports = function () {
  return {
    MemberExpression: function () {
      throw new Error('Primitive rule is deprecated. Please use one rule typelint/typeint for everything in your eslint config');
    },
  };
};
