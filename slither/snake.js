const randomize = require("./randomize");
const SnakeSegment = require("./snakeSegment");
const Vector = require("./geometry/vector");
const Circle = require("./geometry/circle");
const utils = require("./utils");

class Snake {
  constructor(game, id, x = 0, y = 0) {
    this.game = game;
    this.id = id;
    this.type = this.constructor.name;
    this.color = randomize.hsl();
    this.isBoosting = false;

    this.segments = [...Array(1)].map(() => new SnakeSegment(this, x, y, 0));
    this.INITIAL_RADIUS = 10;
    this.radius = this.INITIAL_RADIUS;
    this.radius = 20;

    this.steeringSpeed = 200;
    this.speed = 50;

    // 'target' is the direction the player wants to go into
    // 'dir' is the actual direction of the snake
    this.target = this.dir = 0;
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
    this.game.io.to(`${this.id}`).emit("gameOver");
  }

  eatFood(dot, index) {
    this.game.dots = [
      ...this.game.dots.slice(0, index),
      ...this.game.dots.slice(index + 1)
    ];
    // collision
    this.radius += 0.1;
  }

  dropFood() {
    console.log("DROP FOOD");
  }

  update(dt) {
    if (this.isDead) return;

    this.speed = this.isBoosting ? 400 : 200;

    const dx = Math.cos(utils.degreeToRad(this.dir)) * this.speed * dt;
    const dy = Math.sin(utils.degreeToRad(this.dir)) * this.speed * dt;

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

    // move snake's body
    for (let i = 1; i < this.segments.length; i++) {
      if (this.isBoosting) {
        this.segments[i].x = utils.lerp(
          this.segments[i - 1].x,
          this.segments[i].x,
          0.45
        );
        this.segments[i].y = utils.lerp(
          this.segments[i - 1].y,
          this.segments[i].y,
          0.45
        );
      } else {
        this.segments[i].x = utils.lerp(
          this.segments[i - 1].x,
          this.segments[i].x,
          0.6
        );
        this.segments[i].y = utils.lerp(
          this.segments[i - 1].y,
          this.segments[i].y,
          0.6
        );
      }
    }

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
