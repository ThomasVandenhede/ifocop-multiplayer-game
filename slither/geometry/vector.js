function Vector(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

// public static methods
Vector.sum = function() {
  var x = 0,
    y = 0;
  for (var i = 0; i < arguments.length; i++) {
    x += arguments[i].x;
    y += arguments[i].y;
  }
  return new Vector(x, y);
};

Vector.subtract = function(v1, v2) {
  return new Vector(v1.x - v2.x, v1.y - v2.y);
};

Vector.determinant = function(v1, v2) {
  return v1.x * v2.y - v1.y * v2.x;
};

Vector.dotProduct = function(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y;
};

// public non static methods
Vector.prototype.scale = function(a) {
  return new Vector(this.x * a, this.y * a);
};

Vector.prototype.getUnitVector = function() {
  if (this.normSquared === 0) {
    return new Vector();
  } else {
    return new Vector(this.x, this.y).scale(1 / this.norm);
  }
};

Vector.prototype.getNormalVector = function() {
  return new Vector(-this.y, this.x);
};

Vector.prototype.rotateRadians = function(angle) {
  return new Vector(
    Math.cos(angle) * this.x - Math.sin(angle) * this.y,
    Math.sin(angle) * this.x + Math.cos(angle) * this.y
  );
};

Object.defineProperties(Vector.prototype, {
  direction: {
    get: function() {
      return Math.atan2(this.y, this.x);
    },
    set: function(direction) {
      var norm = this.norm;
      this.x = norm * Math.cos(direction);
      this.y = norm * Math.sin(direction);
    }
  },
  normSquared: {
    get: function() {
      return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    }
  },
  norm: {
    get: function() {
      return Math.sqrt(this.normSquared);
    },
    set: function(newNorm) {
      if (this.x === 0 && this.y === 0) {
        return;
      }
      var norm = this.norm;
      this.x *= newNorm / norm;
      this.y *= newNorm / norm;
    }
  }
});

module.exports = Vector;
