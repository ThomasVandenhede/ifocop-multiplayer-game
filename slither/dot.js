const randomize = require("./randomize.js");
// const Vector = require("./geometry/vector.js");
const Circle = require("./geometry/circle.js");
const utils = require("./utils.js");

class Dot extends Circle {
  constructor(game, x = 0, y = 0, r) {
    super(x, y, r);
    this.game = game;
    this.type = this.constructor.name;
    this.INITIAL_X = x;
    this.INITIAL_Y = y;
    this.INITIAL_RADIUS = r;
    this.color = randomize.hsl();

    // how much food this dot is worth
    this.value = utils.randInt(10, 20);

    this.creationTime = Date.now();
    this.randomDeltaTime = utils.randInt(0, 10000);
    this.blinkDuration = utils.randInt(300, 600);
    this.rotateDuration = utils.randInt(3000, 5000);

    this.isBlinking = true;
  }

  die() {
    this.isDead = true;
  }

  update() {
    const time = Date.now() - this.creationTime + this.randomDeltaTime;
    const t = (Math.cos((time * Math.PI * 2) / this.blinkDuration) + 1) / 2;
    this.r = utils.lerp(this.INITIAL_RADIUS * 0.75, this.INITIAL_RADIUS, t);
    this.x =
      this.INITIAL_X +
      20 * Math.cos((time * Math.PI * 2) / this.rotateDuration);
    this.y =
      this.INITIAL_Y +
      20 * Math.sin((time * Math.PI * 2) / this.rotateDuration);
  }
}

module.exports = Dot;
