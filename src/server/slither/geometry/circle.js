var Rectangle = require("./rectangle");
var Vector = require("./vector");

/**
 * A generic circle class.
 * @param {number} x
 * @param {number} y
 * @param {number} r
 */
function Circle(x, y, r) {
  this.x = x || 0;
  this.y = y || 0;
  this.r = r || 0;
}

Object.defineProperties(Circle.prototype, {
  diameter: {
    get: function() {
      return this.r * 2;
    }
  },
  center: {
    get: function() {
      return new Vector(this.x, this.y);
    }
  },
  area: {
    get: function() {
      return Math.PI * this.r * this.r;
    }
  },
  left: {
    get: function() {
      return this.x - this.r;
    }
  },
  right: {
    get: function() {
      return this.x + this.r;
    }
  },
  top: {
    get: function() {
      return this.y - this.r;
    }
  },
  bottom: {
    get: function() {
      return this.y + this.r;
    }
  }
});

Circle.prototype.moveTo = function(x, y) {
  this.x = x;
  this.y = y;
};

/**
 * Determines whether the circle contains a point.
 * @param {number} x
 * @param {number} y
 */
Circle.prototype.containsPoint = function(x, y) {
  return (
    Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2) < Math.pow(this.r, 2)
  );
};

Circle.prototype.getBoundingRect = function() {
  return new Rectangle({
    x: this.x - this.r,
    y: this.y - this.r,
    width: this.r * 2,
    height: this.r * 2
  });
};

module.exports = Circle;
