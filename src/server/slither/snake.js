const Vector = require("./geometry/vector");
const Circle = require("./geometry/circle");
const utils = require("../../shared/utils");
const Dot = require("./dot");

class Snake {
  constructor({ game, id, x, y, name }) {
    this.game = game;

    this.name = name || "";

    // the area that the client sees (camera position and dimensions)
    this.viewport;

    this.id = id;
    this.type = this.constructor.name;
    this.hue = utils.randInt(0, 359);

    this.isDead = false;

    // drop food
    this.lastDroppedFoodTime = Date.now();
    this.dropFoodInterval = 1000 / 6; // drop 6 foods per sec

    // body mass
    this.mass = this.INITIAL_MASS = 10;

    // positions
    this.x = x || this.game.world.x;
    this.y = y || this.game.world.y;
    this.segments = Array.from({ length: 10 }, () => ({ x, y, dir: 0 }));

    // speed and acceleration
    this.speed = this.BASE_SPEED = 150;
    this.MAX_SPEED = 400;
    this.steering = this.INITIAL_STEERING = 250;
    this.isBoosting = false;

    // size
    this.radius = this.INITIAL_RADIUS = 15;

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

  /**
   * Simply a useful way of accessing the snake's tail.
   */
  get tail() {
    return this.segments[this.segments.length - 1];
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
    this.game.handleGameOver(this.id);
  }

  eatFood(index) {
    const dot = this.game.dots[index];
    dot.destroy(this, () => {
      this.mass += dot.mass;
      this.steering =
        (this.INITIAL_STEERING * this.INITIAL_RADIUS) / this.radius;
      this.game.spawnRandomDot();
    });
  }

  /**
   * Drop one piece of food from the snake's tail.
   */
  dropFood() {
    // determine food coordinates
    const tail = this.segments[this.segments.length - 1];
    const x = Math.round(
      tail.x - this.radius * Math.cos((tail.dir * Math.PI * 2) / 360)
    );
    const y = Math.round(
      tail.y - this.radius * Math.sin((tail.dir * Math.PI * 2) / 360)
    );

    // add food to the world
    const dot = new Dot({ game: this.game, x, y, mass: 1, hue: this.hue });
    this.game.dots.push(dot);

    // decrease mass
    this.mass -= dot.mass;

    // save timestamp
    this.lastDroppedFoodTime = Date.now();
  }

  /**
   * Convert body mass to food and drop that food at random locations along the body.
   */
  dropAllFood() {
    console.log("dropping food");
    for (let i = 0; i < this.segments.length - 1; i++) {
      const segment = this.segments[i];
      const x = segment.x;
      const y = segment.y;
      // some mass is lost along the way (maybe?)
      const segmentMass = (this.mass - (this.mass % 10)) / this.segments.length;
    }
  }

  update(dt) {
    if (this.isDead) return;

    // forbid boosting when player is too small
    if (this.mass <= this.INITIAL_MASS) this.isBoosting = false;

    // periodically drop food when player is boosting
    if (
      this.isBoosting &&
      Date.now() - this.lastDroppedFoodTime >= this.dropFoodInterval
    ) {
      this.dropFood();
    }

    // accelerate or brake
    this.speed = this.isBoosting
      ? Math.min(this.MAX_SPEED, this.speed + 600 * dt)
      : Math.max(this.BASE_SPEED, this.speed - 600 * dt);

    // update direction (angle)
    if (this.target !== this.dir) {
      if (utils.absAngleWithin180(this.target - this.dir) < 0) {
        this.dir -= this.steering * dt;
      }
      if (utils.absAngleWithin180(this.target - this.dir) > 0) {
        this.dir += this.steering * dt;
      }
      this.dir = utils.toFixedPrecision(utils.absAngleWithin180(this.dir), 2);
    }

    // move snake's head (which also happens to be the snakes location)
    const dx = Math.cos(utils.degToRad(this.dir)) * this.speed * dt;
    const dy = Math.sin(utils.degToRad(this.dir)) * this.speed * dt;
    this.x = utils.toFixedPrecision((this.head.x += dx), 2);
    this.y = utils.toFixedPrecision((this.head.y += dy), 2);
    this.head.dir = this.dir;

    // update radius
    this.radius = this.INITIAL_RADIUS + (this.mass - this.INITIAL_MASS) * 0.1;

    // update length
    const length = Math.ceil((this.mass / this.radius) * 15);
    if (length > this.segments.length) {
      this.segments.push({ ...this.tail });
    } else if (length < this.segments.length) {
      this.segments.pop();
    }

    // move snake's body
    for (let i = 1; i < this.segments.length; i++) {
      // translate segment
      if (this.isBoosting) {
        this.segments[i].x = utils.toFixedPrecision(
          utils.lerp(this.segments[i - 1].x, this.segments[i].x, 0.45),
          2
        );
        this.segments[i].y = utils.toFixedPrecision(
          utils.lerp(this.segments[i - 1].y, this.segments[i].y, 0.45),
          2
        );
      } else {
        this.segments[i].x = utils.toFixedPrecision(
          utils.lerp(this.segments[i - 1].x, this.segments[i].x, 0.6),
          2
        );
        this.segments[i].y = utils.toFixedPrecision(
          utils.lerp(this.segments[i - 1].y, this.segments[i].y, 0.6),
          2
        );
      }
      // work out the snake's body part direction
      this.segments[i].dir = utils.toFixedPrecision(
        (Math.atan2(
          this.segments[i - 1].y - this.segments[i].y,
          this.segments[i - 1].x - this.segments[i].x
        ) *
          360) /
          (Math.PI * 2),
        2
      );
    }

    this.runCollisionDetection();
  }

  runCollisionDetection() {
    if (this.isDead) return;

    if (
      this.detectCollisionWithOpponents() ||
      this.detectCollisionWithBoundary()
    ) {
      this.die();
      this.dropAllFood();
      return;
    }
    this.detectCollisionWithDots();
  }

  detectCollisionWithOpponents() {
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
    return allSegments.find(segment =>
      segment.containsPoint(this.forehead.x, this.forehead.y)
    );
  }

  detectCollisionWithBoundary() {
    return !this.game.world.containsPoint(this.forehead.x, this.forehead.y);
  }

  detectCollisionWithDots() {
    // test head collision with dots
    // We're removing dots while iterating, hence the revoersed
    // iteration order, to avoid missing indices.
    const dirRad = (this.dir * Math.PI * 2) / 360;
    const suckRadius = 1.75 * this.radius;
    const suckCircle = new Circle(
      this.x + (suckRadius - this.radius) * Math.cos(dirRad),
      this.y + (suckRadius - this.radius) * Math.sin(dirRad),
      suckRadius
    );
    for (let index = this.game.dots.length - 1; index >= 0; index--) {
      const dot = this.game.dots[index];
      if (
        Math.pow(dot.x - suckCircle.x, 2) + Math.pow(dot.y - suckCircle.y, 2) <
        Math.pow(suckCircle.r + dot.r, 2)
      ) {
        this.eatFood(index);
      }
    }
  }
}

module.exports = Snake;
