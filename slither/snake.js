const randomize = require("./randomize");
const Vector = require("./geometry/vector");
const Circle = require("./geometry/circle");
const utils = require("./utils");
const Dot = require("./dot");

class Snake {
  constructor(game, id, x = 0, y = 0) {
    this.game = game;
    this.id = id;
    this.type = this.constructor.name;
    this.color = randomize.hsl();

    this.isDead = false;

    // drop food
    this.lastDroppedFoodTime = Date.now();
    this.dropFoodInterval = 300;

    // body mass
    this.mass = 100;

    // positions
    this.x = x;
    this.y = y;
    this.segments = Array.from({ length: 10 }, () => ({ x, y, dir: 0 }));

    // speed and acceleration
    this.speed = this.BASE_SPEED = 150;
    this.MAX_SPEED = 400;
    this.steering = this.INITIAL_STEERING = 250;
    this.isBoosting = false;

    // size
    this.radius = this.INITIAL_RADIUS = 15;

    // direction
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
      this.head.x + Math.cos(utils.degToRad(this.dir)) * this.radius,
      this.head.y + Math.sin(utils.degToRad(this.dir)) * this.radius
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
    // remove dot
    this.game.dots = [
      ...this.game.dots.slice(0, index),
      ...this.game.dots.slice(index + 1)
    ];

    // acquire dot color
    this.color = dot.color;

    // add new dot
    this.game.spawnRandomDot();

    // collision
    this.radius += 0.2;
    this.steering = (this.INITIAL_STEERING * this.INITIAL_RADIUS) / this.radius;
  }

  dropFood() {
    const tail = this.segments[this.segments.length - 1];
    const x = tail.x - this.radius * Math.cos((tail.dir * Math.PI * 2) / 360);
    const y = tail.y - this.radius * Math.sin((tail.dir * Math.PI * 2) / 360);
    const radius = utils.randInt(8, 12);
    this.game.dots.push(new Dot(this, x, y, radius, this.color));
  }

  update(dt) {
    if (this.isDead) return;

    if (
      this.isBoosting &&
      Date.now() - this.lastDroppedFoodTime >= this.dropFoodInterval
    ) {
      this.dropFood();
      this.lastDroppedFoodTime = Date.now();
    }

    this.speed = this.isBoosting
      ? Math.min(this.MAX_SPEED, this.speed + 800 * dt)
      : Math.max(this.BASE_SPEED, this.speed - 800 * dt);

    if (this.target !== this.dir) {
      if (utils.absAngleWithin180(this.target - this.dir) < 0) {
        this.dir -= this.steering * dt;
      }
      if (utils.absAngleWithin180(this.target - this.dir) > 0) {
        this.dir += this.steering * dt;
      }
      this.dir = utils.absAngleWithin180(this.dir);
    }

    const dx = Math.cos(utils.degToRad(this.dir)) * this.speed * dt;
    const dy = Math.sin(utils.degToRad(this.dir)) * this.speed * dt;

    // move snake's head (which also happens to be the snakes location)
    this.x = this.head.x += dx;
    this.y = this.head.y += dy;
    this.head.dir = this.dir;

    // move snake's body
    for (let i = 1; i < this.segments.length; i++) {
      // translate segment
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
      // work out the snake's body part direction
      this.segments[i].dir =
        (Math.atan2(
          this.segments[i - 1].y - this.segments[i].y,
          this.segments[i - 1].x - this.segments[i].x
        ) *
          360) /
        (Math.PI * 2);
    }

    this.runCollisionDetection();
  }

  runCollisionDetection() {
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

    // test forehead collision with other snakes
    const collidingSegments = allSegments.find(segment =>
      segment.containsPoint(this.forehead.x, this.forehead.y)
    );

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
