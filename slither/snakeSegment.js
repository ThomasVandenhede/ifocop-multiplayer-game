const Vector = require("./geometry/vector");

class SnakeSegment extends Vector {
  /**
   * A snake's segment can be represented as a vector and a direction.
   * @param {*} snake // reference to parent snake
   * @param {*} x // center x
   * @param {*} y // center y
   * @param {*} dir // direction the segment is facing
   */
  constructor(snake, x, y, dir = 0) {
    super(x, y);
    this.type = this.constructor.name;
    this.snake = snake;
    this.dir = dir;
  }

  /**
   * Reference to the snake's radius.
   */
  get radius() {
    return this.snake.radius;
  }
}

module.exports = SnakeSegment;
