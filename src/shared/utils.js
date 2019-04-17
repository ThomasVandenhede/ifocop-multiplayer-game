const utils = {
  randInt(start, end) {
    return Math.floor(Math.random() * (end - start + 1) + start);
  },
  toFixedPrecision(number, precision = 0) {
    return +number.toFixed(precision);
  },
  noop() {},
  degToRad(degree) {
    return (degree / 360) * 2 * Math.PI;
  },
  lerp(v0, v1, t) {
    return (1 - t) * v0 + t * v1;
  },
  absLessThanPI(angle) {
    const PI2 = Math.PI * 2;
    let absWithin2PI = angle % PI2;
    if (absWithin2PI > Math.PI) return absWithin2PI - PI2;
    if (absWithin2PI < -Math.PI) return absWithin2PI + PI2;
    return absWithin2PI;
  },
  // CREDIT: https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
  hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
};

if (typeof module === "object") {
  module.exports = utils;
} else {
  window.utils = utils;
}
