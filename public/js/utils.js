export const toFixedPrecision = (number, precision = 0) =>
  +number.toFixed(precision);

export const noop = function() {};

export const lerp = (v0, v1, t) => (1 - t) * v0 + t * v1;

export const degToRad = degree => (degree / 360) * 2 * Math.PI;

export const absAngleWithin180 = angle => {
  let absWithin360 = angle % 360;
  if (absWithin360 > 180) return absWithin360 - 360;
  if (absWithin360 < -180) return absWithin360 + 360;
  return absWithin360;
};
