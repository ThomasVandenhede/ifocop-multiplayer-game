var Rectangle = require("./rectangle");
var Vector = require("./vector");

var Segment = (function() {
  function Segment(A, B) {
    this.A = A;
    this.B = B;
  }

  Segment.prototype.getBoundingRect = function() {
    return new Rectangle({
      x: Math.min(this.A.x, this.B.x),
      y: Math.min(this.A.y, this.B.y),
      width: Math.abs(this.B.x - this.A.x),
      height: Math.abs(this.B.y - this.A.y)
    });
  };

  Segment.prototype.isOrthogonalProjectedPointOnSegment = function(P) {
    var AB = Vector.subtract(this.B, this.A);
    var AP = Vector.subtract(P, this.A);
    var BP = Vector.subtract(P, this.B);
    return Vector.dotProduct(AB, AP) * Vector.dotProduct(AB, BP) <= 0;
  };

  Segment.prototype.getOrthogonalProjectionOfPoint = function(P) {
    var u = Vector.subtract(this.B, this.A).getUnitVector();
    var AP = Vector.subtract(P, this.A);
    var AH = Vector.dotProduct(AP, u);

    return Vector.sum(this.A, u.scale(AH));
  };

  Segment.prototype.getDistanceFromPoint = function(P) {
    // return Vector.subtract(this.getOrthogonalProjectionOfPoint(P), P).norm;
    var AB = Vector.subtract(this.B, this.A);
    var t = Vector.dotProduct(Vector.subtract(P, this.A), AB) / AB.norm;
    if (t < 0) {
      return Vector.subtract(A, P).norm;
    } else if (t > 1) {
      return Vector.subtract(B, P).norm;
    } else {
    }
  };

  Segment.prototype.getDistanceFromPointToLine = function(P) {
    var n = Vector.subtract(this.B, this.A)
      .getUnitVector()
      .getNormalVector();
    var d = Math.abs(Vector.dotProduct(Vector.subtract(P, this.A), n));
    return d;
  };

  Segment.prototype.getClosestPointOnSegment = function(P) {
    var AP = Vector.subtract(P, this.A);
    var AB = Vector.subtract(this.B, this.A);
    var normAB = AB.norm;
    var u = AB.scale(1 / normAB); // unit vector of AB
    var t = Vector.dotProduct(AP, u) / normAB;

    if (t < 0) {
      return this.A;
    } else if (t > 1) {
      return this.B;
    } else {
      var AH = Vector.dotProduct(AP, u);
      return Vector.sum(this.A, u.scale(AH));
    }
  };

  Segment.prototype.getPointOfIntersectionWithCircle = function(c) {
    var C = new Vector(c.x, c.y);
    var H = this.getClosestPointOnSegment(C);
    if ((CH = Vector.subtract(H, C).normSquared < Math.pow(c.r, 2))) {
      return H;
    }
    return false;
  };

  return Segment;
})();

module.exports = Segment;
