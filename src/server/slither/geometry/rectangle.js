var Vector = require("./vector");

function Rectangle(props) {
  this.x = props.x || 0;
  this.y = props.y || 0;
  this.width = props.width !== undefined ? props.width : 0;
  this.height = props.height !== undefined ? props.height : 0;
}

Object.defineProperties(Rectangle.prototype, {
  left: {
    get: function() {
      return this.width >= 0 ? this.x : this.x + this.width;
    },
    set: function(left) {
      this.x = left;
    }
  },
  top: {
    get: function() {
      return this.height >= 0 ? this.y : this.y + this.height;
    },
    set: function(left) {
      this.y = bottom;
    }
  },
  right: {
    get: function() {
      return this.width >= 0 ? this.x + this.width : this.x;
    },
    set: function(right) {
      if (this.width === Number.POSITIVE_INFINITY) {
        this.x = Number.NEGATIVE_INFINITY; // edge case
      } else {
        this.x = right - this.width;
      }
    }
  },
  bottom: {
    get: function() {
      return this.height >= 0 ? this.y + this.height : this.y;
    },
    set: function(bottom) {
      if (this.height === Number.POSITIVE_INFINITY) {
        this.y = Number.NEGATIVE_INFINITY; // edge case
      } else {
        this.y = bottom - this.height;
      }
    }
  },
  center: {
    get: function() {
      return new Vector(this.x + this.width / 2, this.y + this.height / 2);
    },
    set: function(x, y) {
      this.x = x - this.width / 2;
      this.y = y - this.height / 2;
    }
  }
});

// static methods
Rectangle.minkowskiDifference = function(r1, r2) {
  return new Rectangle({
    x: r1.left - r2.right,
    y: r1.top - r2.bottom,
    width: r1.width + r2.width,
    height: r1.height + r2.height
  });
};

// public methods
Rectangle.prototype.inflate = function(dx, dy) {
  this.x -= dx;
  this.width += 2 * dx;
  this.y -= dy;
  this.height += 2 * dy;
  return this;
};

Rectangle.prototype.resize = function(width, height) {
  this.width = width;
  this.height = height;
  return this;
};

Rectangle.prototype.getBoundingRect = function() {
  return this;
};

Rectangle.prototype.within = function(r) {
  return (
    r.left <= this.left &&
    r.right >= this.right &&
    r.top <= this.top &&
    r.bottom >= this.bottom
  );
};

Rectangle.prototype.overlaps = function(r) {
  return (
    this.left < r.right &&
    r.left < this.right &&
    this.top < r.bottom &&
    r.top < this.bottom
  );
};

Rectangle.prototype.contains = function(x, y) {
  return x >= this.left && x <= this.right && y >= this.top && y <= this.bottom;
};

Rectangle.prototype.containsStrict = function(x, y) {
  return x > this.left && x < this.right && y > this.top && y < this.bottom;
};

module.exports = Rectangle;
