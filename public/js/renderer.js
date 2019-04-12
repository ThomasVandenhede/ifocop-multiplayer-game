import AABB from "./aabb.js";
import * as utils from "./utils.js";
import { PI2 } from "./constants.js";
import Vector from "./vector.js";

export default class Renderer {
  constructor(game) {
    this.game = game;

    // Layering technique.
    // We draw parts of the scene on different canvases.
    this.backgroundCanvas = document.getElementById("background");
    this.backgroundCtx = this.backgroundCanvas.getContext("2d");

    this.dotsCanvas = document.getElementById("dots");
    this.dotsCtx = this.dotsCanvas.getContext("2d");

    this.snakesCanvas = document.getElementById("snakes");
    this.snakesCtx = this.snakesCanvas.getContext("2d");
  }

  register(gameObject) {
    const methods = {
      Dot: function(ctx, camera) {
        // animate dot
        const timePI2 = (Date.now() - this.creationTime) * PI2;
        const t = (Math.cos(timePI2 / this.blinkDuration) + 1) / 2;
        this.r = utils.lerp(this.INITIAL_RADIUS * 0.75, this.INITIAL_RADIUS, t);
        this.x =
          this.INITIAL_X +
          this.rotateRadius * Math.cos(timePI2 / this.rotateDuration);
        this.y =
          this.INITIAL_Y +
          this.rotateRadius * Math.sin(timePI2 / this.rotateDuration);

        ctx.save();
        ctx.globalAlpha = 1;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.r * 3;
        ctx.fillStyle = this.color;

        ctx.beginPath();
        ctx.arc(
          camera.applyToX(this.x),
          camera.applyToY(this.y),
          camera.applyToDistance(this.r),
          0,
          PI2
        );
        ctx.fill();
        ctx.fill();
        ctx.restore();
      },
      Snake: function(ctx, camera) {
        const segmentCount = this.segments.length;

        // draw snake
        ctx.save();
        ctx.lineCap = ctx.lineJoin = "round";
        ctx.strokeStyle = this.color;
        ctx.lineWidth = camera.applyToDistance(this.radius * 2);
        ctx.beginPath();
        ctx.moveTo(
          camera.applyToX(this.segments[segmentCount - 1].x),
          camera.applyToY(this.segments[segmentCount - 1].y)
        );
        for (let i = this.segments.length - 2; i >= 0; i--) {
          const segment = this.segments[i];
          ctx.lineTo(camera.applyToX(segment.x), camera.applyToY(segment.y));
        }
        ctx.stroke();
        ctx.restore();

        // draw mono-eye
        const eyeRadius = 0.8 * this.radius;
        const irisRadius = eyeRadius * 0.7;
        const eye = Vector.from(this.segments[0]);

        ctx.save();
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(
          camera.applyToX(eye.x),
          camera.applyToY(eye.y),
          camera.applyToDistance(eyeRadius),
          0,
          PI2
        );
        ctx.fill();
        ctx.restore();

        // iris
        const iris = Vector.sum(
          eye,
          new Vector(
            Math.cos((this.target * PI2) / 360),
            Math.sin((this.target * PI2) / 360)
          ).mult(eyeRadius - irisRadius)
        );

        ctx.save();
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(
          camera.applyToX(iris.x),
          camera.applyToY(iris.y),
          camera.applyToDistance(irisRadius),
          0,
          PI2
        );
        ctx.fill();
        ctx.restore();
      },

      World: function(ctx, camera) {
        ctx.save();
        ctx.drawImage(
          window.bgCanvas,
          camera.x + 4000, // -4000 is world.x
          camera.y + 4000, // -4000 is world.y
          camera.width,
          camera.height,
          0,
          0,
          window.innerWidth,
          window.innerHeight
        );
        ctx.restore();
      }
    };

    // add a render method to a game object based on its type
    gameObject.render = methods[gameObject.type].bind(gameObject);
  }

  clearCanvases() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Clear all canvases
    this.backgroundCtx.clearRect(0, 0, width, height);
    this.dotsCtx.clearRect(0, 0, width, height);
    this.snakesCtx.clearRect(0, 0, width, height);
  }

  render() {
    window.m_canvas = document.createElement("canvas");
    window.m_canvas.width = window.background.width;
    window.m_canvas.height = window.background.height;
    var m_context = window.m_canvas.getContext("2d");
    m_context.drawImage(
      window.background,
      0,
      0,
      window.background.width,
      window.background.height
    );

    this.clearCanvases();

    // Render world
    this.game.world.render(this.backgroundCtx, this.game.camera);

    // Render dots
    this.game.dots.forEach(dot => {
      var boundingRect = new AABB({
        x: dot.x - dot.r,
        y: dot.y - dot.r,
        width: dot.r * 2,
        height: dot.r * 2
      });
      if (boundingRect.overlaps(this.game.camera)) {
        dot.render(this.dotsCtx, this.game.camera);
      }
    });

    // Render snakes
    this.game.snakes.forEach(snake =>
      snake.render(this.snakesCtx, this.game.camera)
    );
  }
}
