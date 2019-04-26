const constants = {
  PI2: Math.PI * 2,
  MAX_CANVAS_SIZE: 1500,
  WORLD_RADIUS: 2000
};

if (typeof module === "object") {
  module.exports = constants;
} else {
  for (let [key, value] of Object.entries(constants)) {
    window[key] = value;
  }
}
