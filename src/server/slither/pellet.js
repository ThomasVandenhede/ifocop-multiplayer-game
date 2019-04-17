const Circle = require("./geometry/circle.js");
const utils = require("../../shared/utils.js");

const getRadiusFromSize = size => {
  if (size === "xs") return 5;
  if (size === "s") return 8;
  if (size === "m") return 15;
  if (size === "l") return 20;
};

const getMassFromSize = size => {
  if (size === "xs") return utils.randInt(12, 14) / 10;
  if (size === "s") return utils.randInt(6, 40) / 10;
  if (size === "m") return utils.randInt(10, 12);
  if (size === "l") return 50;
};

class Pellet extends Circle {
  constructor({ game, x = 0, y = 0, size, hue }) {
    super(x, y, getRadiusFromSize(size));
    this.game = game;

    this.mass = getMassFromSize(size);
    this.type = this.constructor.name;
    this.INITIAL_X = this.x;
    this.INITIAL_Y = this.y;
    this.INITIAL_RADIUS = this.r;
    this.r = 0;
    this.hue = hue;

    // how much length this pellet is worth
    this.value = utils.randInt(10, 20);

    // timings
    this.creationTime = Date.now();

    // spawn animation
    this.isSpawning = true;
    this.spawnDuration = 300; // pellet takes this long to reach full size

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
        // remove pellet
        const index = this.game.pellets.indexOf(this);
        this.game.pellets = [
          ...this.game.pellets.slice(0, index),
          ...this.game.pellets.slice(index + 1)
        ];
        this.dieCallback();
      }
    }
  }
}

module.exports = Pellet;
