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

    // timings
    this.creationTime = Date.now();

    // spawn animation
    this.isSpawning = true;
    this.spawnDuration = 300; // dot takes this long to reach full size

    // die animation
    this.deathTime = null;
    this.isDying = false;
    this.deathDuration = 300;
    this.killer = null;

    // blink and rotate animations
    this.isBlinking = true;
    this.randomDeltaTime = utils.randInt(0, 10000);
    this.blinkDuration = utils.randInt(300, 600);
    this.rotateDuration = utils.randInt(3000, 5000);
    this.rotateRadius = 20;
  }

  destroy(killer, cb) {
    if (this.isDying) return;

    this.killer = killer;
    this.dieCallback = cb;
    this.startDeathAnimation();
  }

  startDeathAnimation() {
    this.deathTime = Date.now();
    this.isDying = true;
    this.deathX = this.x;
    this.deathY = this.y;
  }

  update() {
    if (this.isSpawning) {
      const t = (Date.now() - this.creationTime) / this.spawnDuration;
      this.r = Math.min(this.INITIAL_RADIUS, t * this.INITIAL_RADIUS);

      if (t > 1) {
        this.isSpawning = false;
      }
    }

    if (this.isDying) {
      const t = (Date.now() - this.deathTime) / this.deathDuration;
      this.x = utils.lerp(this.deathX, this.killer.x, t);
      this.y = utils.lerp(this.deathY, this.killer.y, t);
      this.r = Math.max(0, (1 - t) * this.INITIAL_RADIUS);

      if (t > 1) {
        this.isDead = true;
      }

      if (this.isDead) {
        // remove dot
        const index = this.game.dots.indexOf(this);
        this.game.dots = [
          ...this.game.dots.slice(0, index),
          ...this.game.dots.slice(index + 1)
        ];
        this.dieCallback();
      }
    }
  }
}

module.exports = Dot;
