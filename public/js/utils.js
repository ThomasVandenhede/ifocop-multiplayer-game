export const toFixedPrecision = function(number, precision = 0) {
  return +number.toFixed(precision);
};

export const noop = function() {};

export const lerp = function(v0, v1, t) {
  return (1 - t) * v0 + t * v1;
};

export const degreeToRad = degree => {
  return (degree / 360) * 2 * Math.PI;
};

export const absAngleWithin180 = angle => {
  let absWithin360 = angle % 360;
  if (absWithin360 > 180) return absWithin360 - 360;
  if (absWithin360 < -180) return absWithin360 + 360;
  return absWithin360;
};
