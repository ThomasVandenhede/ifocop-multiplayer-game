const Circle = require("./geometry/circle.js");
const utils = require("./utils.js");

class Dot extends Circle {
  constructor(game, x = 0, y = 0, r, color) {
    super(x, y, r);
    this.game = game;
    this.type = this.constructor.name;
    this.INITIAL_X = x;
    this.INITIAL_Y = y;
    this.INITIAL_RADIUS = r;
    this.color = color;

    // how much food this dot is worth
    this.value = utils.randInt(10, 20);

    this.creationTime = Date.now();
    this.randomDeltaTime = utils.randInt(0, 10000);
    this.blinkDuration = utils.randInt(300, 600);
    this.rotateDuration = utils.randInt(3000, 5000);
    this.rotateRadius = 20;

    this.isBlinking = true;
  }

  die() {
    this.isDead = true;
  }

  update() {}
}

module.exports = Dot;
