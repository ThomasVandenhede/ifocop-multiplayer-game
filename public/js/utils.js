export const toFixedPrecision = function(number, precision = 0) {
  return +number.toFixed(precision);
};

export const noop = function() {};
