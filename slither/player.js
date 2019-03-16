const randomize = require("./randomize.js");
const Vector = require("./vector").Vector;
const utils = require("./utils");

class Player {
  constructor(id, x = 0, y = 0) {
    this.id = id;
    this.type = this.constructor.name;
    this.color = randomize.hsl();
    this.isBoosting = false;

    this.segments = [...Array(60)].map(() => new Vector(x, y));
    this.width = Player.PLAYER_INITIAL_RADIUS;
    this.height = Player.PLAYER_INITIAL_RADIUS;
    this.radius = Player.PLAYER_INITIAL_RADIUS;

    this.speed = 5;
    this.dir = 0;
  }

  static get PLAYER_INITIAL_RADIUS() {
    return 30;
  }

  update(dt) {
    this.speed = this.isBoosting ? 10 : 5;

    // move head
    this.segments[0].x =
      Math.sin(utils.degreeToRad(this.dir)) * this.speed + this.segments[0].x;
    this.segments[0].y =
      Math.cos(utils.degreeToRad(this.dir)) * this.speed + this.segments[0].y;

    // move body
    for (let i = 1; i < this.segments.length; i++) {
      if (this.isBoosting) {
        this.segments[i].x = utils.lerp(
          this.segments[i - 1].x,
          this.segments[i].x,
          0.7
        );
        this.segments[i].y = utils.lerp(
          this.segments[i - 1].y,
          this.segments[i].y,
          0.7
        );
      } else {
        this.segments[i].x = utils.lerp(
          this.segments[i - 1].x,
          this.segments[i].x,
          0.8
        );
        this.segments[i].y = utils.lerp(
          this.segments[i - 1].y,
          this.segments[i].y,
          0.8
        );
      }
    }
  }
}

module.exports.Player = Player;
