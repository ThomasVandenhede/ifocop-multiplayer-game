const Circle = require("./geometry/circle.js");
const utils = require("../../shared/utils.js");

const getRadiusFromMass = mass => {
  if (mass === 1) return 5;
  if (mass === 3) return 8;
  if (mass === 10) return 15;
  if (mass === 50) return 20;
};

class Dot extends Circle {
  constructor(game, x = 0, y = 0, mass, hue) {
    super(x, y, getRadiusFromMass(mass));
    this.game = game;

    // 1 xs; 3 s; 10 m; 50 l
    // xs is dropped when a snake is boosting
    // s is automatically generated
    // m is dropped when a snake dies
    // l is a flying dot
    this.mass = mass;
    this.type = this.constructor.name;
    this.INITIAL_X = this.x;
    this.INITIAL_Y = this.y;
    this.INITIAL_RADIUS = this.r;
    this.hue = hue;

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
