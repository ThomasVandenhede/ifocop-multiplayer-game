const randomize = require("./randomize.js");
const Vector = require("./geometry/vector");
const Circle = require("./geometry/circle");
const utils = require("./utils.js");

class Snake {
  constructor(game, id, x = 0, y = 0) {
    this.game = game;
    this.id = id;
    this.type = this.constructor.name;
    this.color = randomize.hsl();
    this.isBoosting = false;

    this.segments = [...Array(10)].map(() => new Vector(x, y));
    this.radius = Snake.INITIAL_RADIUS;

    this.speed = 5;
    this.dir = 0;
  }

  static get INITIAL_RADIUS() {
    return 30;
  }

  /**
   * Simply a useful way of accessing the snake's head.
   */
  get head() {
    return this.segments[0];
  }

  // The snake forehead is the point at the front of the snake's head
  // that should NOT collide with other snakes nor leave the game area.
  get forehead() {
    return new Vector(
      this.head.x + Math.cos(utils.degreeToRad(this.dir)) * this.radius,
      this.head.y + Math.sin(utils.degreeToRad(this.dir)) * this.radius
    );
  }

  get segmentsBoundingCircles() {
    return this.segments.map(
      segment => new Circle(segment.x, segment.y, this.radius)
    );
  }

  die() {
    this.isDead = true;
  }

  dropFood() {
    console.log("DROP FOOD");
  }

  update() {
    if (this.isDead) return;

    this.speed = this.isBoosting ? 20 : 10;

    const dx = Math.cos(utils.degreeToRad(this.dir)) * this.speed;
    const dy = Math.sin(utils.degreeToRad(this.dir)) * this.speed;
    // find all collidable opponents
    const opponents = this.game.snakes.filter(
      snake => !snake.isDead && snake.id !== this.id
    );
    // put together an array with all opponents' segments
    const allSegments = opponents.reduce(
      (segments, opponent) => [
        ...segments,
        ...opponent.segmentsBoundingCircles
      ],
      []
    );

    // move head
    this.head.x += dx;
    this.head.y += dy;

    // MOVE THIS PART TO CLIENT
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

    // test collision with other snakes
    const collidingSegments = allSegments.find(segment =>
      segment.containsPoint(this.forehead.x, this.forehead.y)
    );
    // test collision with world boundaries
    const outsideWorldBounds = !this.game.world.containsPoint(
      this.forehead.x,
      this.forehead.y
    );

    if (collidingSegments || outsideWorldBounds) {
      this.die();
      this.dropFood();
      return;
    }
  }
}

module.exports = Snake;
