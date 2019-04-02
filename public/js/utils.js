export const toFixedPrecision = function(number, precision = 0) {
  return +number.toFixed(precision);
};

export const noop = function() {};

export const lerp = function(v0, v1, t) {
  return (1 - t) * v0 + t * v1;
};
