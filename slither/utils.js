module.exports = {
  randInt(start, end) {
    return Math.floor(Math.random() * (end - start + 1) + start);
  },
  toFixedPrecision(number, precision = 0) {
    return +number.toFixed(precision);
  },
  noop() {},
  degreeToRad(degree) {
    return (degree / 360) * 2 * Math.PI;
  },
  lerp(v0, v1, t) {
    return (1 - t) * v0 + t * v1;
  },
  absAngleWithin180(angle) {
    let absWithin360 = angle % 360;
    if (absWithin360 > 180) return absWithin360 - 360;
    if (absWithin360 < -180) return absWithin360 + 360;
    return absWithin360;
  }
};
