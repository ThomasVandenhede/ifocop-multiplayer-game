module.exports.toFixedPrecision = function(number, precision = 0) {
  return +number.toFixed(precision);
};

module.exports.noop = function() {};

module.exports.degreeToRad = function(degree) {
  return (degree / 360) * 2 * Math.PI;
};
