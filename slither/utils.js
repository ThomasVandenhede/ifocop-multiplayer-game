module.exports.toFixedPrecision = function(number, precision = 0) {
  return +number.toFixed(precision);
};

module.exports.noop = function() {};
