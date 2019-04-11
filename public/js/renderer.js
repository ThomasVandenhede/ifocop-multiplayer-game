import AABB from "./aabb.js";
import * as utils from "./utils.js";

export default class Renderer {
  constructor(game) {
    this.game = game;

    // Layering technique.
    // We draw parts of the scene on different canvases.
    this.backgroundCanvas = document.getElementById("background");
    this.backgroundCtx = this.backgroundCanvas.getContext("2d");
    this.backgroundCtx.imageSmoothing = false;

    this.dotsCanvas = document.getElementById("dots");
    this.dotsCtx = this.dotsCanvas.getContext("2d");
    this.dotsCtx.imageSmoothing = false;

    this.snakesCanvas = document.getElementById("snakes");
    this.snakesCtx = this.snakesCanvas.getContext("2d");
    this.snakesCtx.imageSmoothing = false;
  }

  register(gameObject) {
    const methods = {
      Dot: function(ctx, camera) {
        const time = Date.now() - this.creationTime + this.randomDeltaTime;
        const t = (Math.cos((time * Math.PI * 2) / this.blinkDuration) + 1) / 2;
        this.r = utils.lerp(this.INITIAL_RADIUS * 0.75, this.INITIAL_RADIUS, t);
        this.x =
          this.INITIAL_X +
          this.rotateRadius *
            Math.cos((time * Math.PI * 2) / this.rotateDuration);
        this.y =
          this.INITIAL_Y +
          this.rotateRadius *
            Math.sin((time * Math.PI * 2) / this.rotateDuration);

        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(
          camera.applyToX(this.x),
          camera.applyToY(this.y),
          camera.applyToDistance(this.r),
          0,
          Math.PI * 2
        );
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.r * 3;
        ctx.fill();
        ctx.fill();
        ctx.restore();
      },
      Snake: function(ctx, camera) {
        ctx.save();
        var canvas = document.getElementById("snakes");
        var m_canvas = document.createElement("canvas");
        var m_context = m_canvas.getContext("2d");
        var snake_bodypart_canvas = document.createElement("canvas");
        var snake_bodypart_canvas_context = snake_bodypart_canvas.getContext(
          "2d"
        );

        snake_bodypart_canvas.width = window.snake.width;
        snake_bodypart_canvas.height = window.snake.height;
        snake_bodypart_canvas_context.drawImage(window.snake, 0, 0);

        m_canvas.width = window.innerWidth;
        m_canvas.height = window.innerHeight;

        for (let i = this.segments.length - 1; i >= 0; i--) {
          const self = this.segments;
          const position = self[i];
          const boundingRect = new AABB({
            x: position.x - this.radius / 2,
            y: position.y - this.radius / 2,
            width: this.radius,
            height: this.radius
          });

          // rendering body part only if it's visible in viewport
          if (boundingRect.overlaps(camera)) {
            m_context.drawImage(
              snake_bodypart_canvas,
              // render i'th sprite in spritesheet
              (i % 10) * window.snake.height,
              0,
              window.snake.height,
              window.snake.height,
              camera.applyToX(position.x - this.radius),
              camera.applyToY(position.y - this.radius),
              camera.applyToDistance(this.radius * 2),
              camera.applyToDistance(this.radius * 2)
            );
          }
        }
        ctx.drawImage(m_canvas, 0, 0);
        ctx.restore();
      },

      World: function(ctx, camera) {
        var canvas = document.getElementById("snakes");
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
    // this.game.world.render(this.backgroundCtx, this.game.camera);

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
