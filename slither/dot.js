const randomize = require("./randomize.js");
// const Vector = require("./geometry/vector.js");
const Circle = require("./geometry/circle.js");
// const utils = require("./utils.js");

class Dot extends Circle {
  constructor(game, x = 0, y = 0, r) {
    super(x, y, r);
    this.game = game;
    this.type = this.constructor.name;
    this.color = randomize.hsl();
  }

  die() {
    this.isDead = true;
  }

  update() {}
}

module.exports = Dot;
