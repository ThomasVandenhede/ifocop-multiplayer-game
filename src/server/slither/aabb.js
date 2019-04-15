const Vector = require("./vector").Vector;

class AABB {
  constructor({ x, y, width = 0, height = 0 }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get left() {
    return this.width >= 0 ? this.x : this.x + this.width;
  }

  set left(left) {
    this.x = left;
  }

  get top() {
    return this.height >= 0 ? this.y : this.y + this.height;
  }

  set top(left) {
    this.y = bottom;
  }

  get right() {
    return this.width >= 0 ? this.x + this.width : this.x;
  }

  set right(right) {
    if (this.width === Number.POSITIVE_INFINITY) {
      this.x = Number.NEGATIVE_INFINITY; // edge case
    } else {
      this.x = right - this.width;
    }
  }

  get bottom() {
    return this.height >= 0 ? this.y + this.height : this.y;
  }

  set bottom(bottom) {
    if (this.height === Number.POSITIVE_INFINITY) {
      this.y = Number.NEGATIVE_INFINITY; // edge case
    } else {
      this.y = bottom - this.height;
    }
  }

  get center() {
    return new Vector(this.x + this.width / 2, this.y + this.height / 2);
  }

  set center({ x, y }) {
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
  }

  static minkowskiDifference(r1, r2) {
    return new AABB({
      x: r1.left - r2.right,
      y: r1.top - r2.bottom,
      width: r1.width + r2.width,
      height: r1.height + r2.height
    });
  }

  getBoundingRect() {
    return this;
  }

  within(r) {
    return (
      r.left <= this.left &&
      r.right >= this.right &&
      r.top <= this.top &&
      r.bottom >= this.bottom
    );
  }

  overlaps(r) {
    return (
      this.left < r.right &&
      r.left < this.right &&
      this.top < r.bottom &&
      r.top < this.bottom
    );
  }

  contains(x, y) {
    return (
      x >= this.left && x <= this.right && y >= this.top && y <= this.bottom
    );
  }

  containsStrict(x, y) {
    return x > this.left && x < this.right && y > this.top && y < this.bottom;
  }
}

module.exports.AABB = AABB;
