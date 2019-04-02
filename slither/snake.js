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

    this.segments = [...Array(150)].map(() => new Vector(x, y));
    this.INITIAL_RADIUS = 20;
    this.radius = this.INITIAL_RADIUS;

    this.speed = 5;
    this.dir = 0;
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

  eatFood(dot, index) {
    this.game.dots = [
      ...this.game.dots.slice(0, index),
      ...this.game.dots.slice(index + 1)
    ];
    // collision
    this.radius += 0.05;
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

    // move head (body gets updated on the client)
    this.head.x += dx;
    this.head.y += dy;

    // test head collision with dots
    for (let index = 0; index < this.game.dots.length; ) {
      const dot = this.game.dots[index];
      const head = new Circle(this.head.x, this.head.y, this.radius);
      if (
        Math.pow(dot.x - head.x, 2) + Math.pow(dot.y - head.y, 2) <
        Math.pow(head.r + dot.r, 2)
      ) {
        this.eatFood(dot, index);
      } else {
        index++;
      }
    }

    // test forehead collision with other snakes
    const collidingSegments = allSegments.find(segment =>
      segment.containsPoint(this.forehead.x, this.forehead.y)
    );

    // test forehead collision with world boundaries
    const outsideWorldBounds = !this.game.world.containsPoint(
      this.forehead.x,
      this.forehead.y
    );

    if (collidingSegments || outsideWorldBounds) {
      console.log("DEAD");
      this.die();
      this.dropFood();
      return;
    }
  }
}

module.exports = Snake;
