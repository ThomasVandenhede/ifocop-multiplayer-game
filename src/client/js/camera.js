import AABB from "./aabb.js";
import Vector from "./vector.js";

var AXIS = {
  NONE: "none",
  HORIZONTAL: "horizontal",
  VERTICAL: "vertical",
  BOTH: "both"
};

export default class Camera extends AABB {
  constructor({ zoomLevel = 1.15, canvas, x = 0, y = 0 }) {
    super({
      x,
      y,
      width: canvas.width,
      height: canvas.height
    });
    this.zoomLevel = zoomLevel;
    this.height = canvas.height / this.zoomLevel;
    this.width = canvas.width / this.zoomLevel;
    this.canvas = canvas;

    this.zoomingRate = 1.1;

    this.xDeadZone = this.canvas.width / 3; // min distance to horizontal borders
    this.yDeadZone = this.canvas.height / 3; // min distance to vertical borders

    this.axis = AXIS.BOTH;

    this.followed = null;

    this.shouldStayWithinWorldBounds = false;
  }

  follow(gameObject) {
    this.followed = gameObject;
    this.x = this.followed.x + this.followed.width / 2 - this.width / 2;
    this.y = this.followed.y + this.followed.height / 2 - this.height / 2;
  }

  center(x, y) {
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
  }

  update() {
    this.updateDimensions();

    // keep following the player (or other desired object)
    if (this.followed) {
      this.x = this.followed.x - this.width / 2;
      this.y = this.followed.y - this.height / 2;
    }
  }

  updateDimensions() {
    this.height = this.canvas.height / this.zoomLevel;
    this.width = this.canvas.width / this.zoomLevel;
  }

  zoomIn(x, y) {
    var centerX = x !== undefined ? x : this.followed.center.x;
    var centerY = y !== undefined ? y : this.followed.center.y;

    this.zoomLevel *= this.zoomingRate;
    if (this.zoomLevel > 8) {
      this.zoomLevel = 8;
    } else {
      this.x = (this.x - centerX) / this.zoomingRate + centerX;
      this.y = (this.y - centerY) / this.zoomingRate + centerY;
    }
  }

  zoomOut(x, y) {
    var centerX = x !== undefined ? x : this.followed.center.x;
    var centerY = y !== undefined ? y : this.followed.center.y;

    this.zoomLevel /= this.zoomingRate;
    if (this.zoomLevel < 0.02) {
      this.zoomLevel = 0.02;
    } else {
      this.x = (this.x - centerX) * this.zoomingRate + centerX;
      this.y = (this.y - centerY) * this.zoomingRate + centerY;
    }
  }

  applyToX(x) {
    return Math.round((x - this.x) * this.zoomLevel);
  }

  applyToY(y) {
    return Math.round((y - this.y) * this.zoomLevel);
  }

  apply(x, y) {
    return new Vector(this.applyToX(x), this.applyToY(y));
  }

  unapplyToX(x) {
    return Math.round(x / this.zoomLevel + this.x);
  }

  unapplyToY(y) {
    return Math.round(y / this.zoomLevel + this.y);
  }

  unapply(x, y) {
    return new Vector(this.unapplyToX(x), this.unapplyToY(y));
  }

  applyToDistance(distance) {
    return Math.round(distance * this.zoomLevel);
  }

  unapplyToDistance(distance) {
    return Math.round(distance / this.zoomLevel);
  }
}
