import AABB from "./aabb.js";

export default class Renderer {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
  }

  register(gameObject) {
    const methods = {
      Dot: function(ctx, camera) {
        var boundingRect = new AABB({
          x: this.x - this.r,
          y: this.y - this.r,
          width: this.r * 2,
          height: this.r * 2
        });
        if (!boundingRect.overlaps(camera)) return;

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
        ctx.fill();
        ctx.restore();
      },
      Snake: function(ctx, camera) {
        ctx.save();
        var canvas = document.getElementById("canvas");
        var m_canvas = document.createElement("canvas");
        var m_context = m_canvas.getContext("2d");
        var snake_bodypart_canvas = document.createElement("canvas");
        var snake_bodypart_canvas_context = snake_bodypart_canvas.getContext(
          "2d"
        );

        snake_bodypart_canvas.width = window.snake.width;
        snake_bodypart_canvas.height = window.snake.height;
        snake_bodypart_canvas_context.drawImage(window.snake, 0, 0);

        m_canvas.width = canvas.width;
        m_canvas.height = canvas.height;

        for (let index = this.segments.length - 1; index >= 0; index--) {
          const self = this.segments;
          const position = self[index];
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
              (index % 10) * window.snake.height,
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
        ctx.save();
        const {
          width: backgroundWidth,
          height: backgroundHeight
        } = window.background;

        // actual rendering
        let minX = camera.x - (camera.x % backgroundWidth) - backgroundWidth;
        let minY = camera.y - (camera.y % backgroundHeight) - backgroundHeight;

        for (let x = minX; x < camera.right; x += backgroundWidth) {
          for (let y = minY; y < camera.bottom; y += backgroundHeight) {
            ctx.drawImage(
              window.m_canvas,
              camera.applyToX(x),
              camera.applyToY(y),
              camera.applyToDistance(backgroundWidth),
              camera.applyToDistance(backgroundHeight)
            );
          }
        }
        ctx.globalCompositeOperation = "destination-in";
        ctx.beginPath();
        ctx.arc(
          camera.applyToX(this.x),
          camera.applyToY(this.y),
          camera.applyToDistance(this.r),
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = "#7E0000";
        ctx.lineWidth = camera.applyToDistance(10);
        ctx.beginPath();
        ctx.arc(
          camera.applyToX(this.x),
          camera.applyToY(this.y),
          camera.applyToDistance(this.r),
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }
    };

    // add a render method to a game object based on its type
    gameObject.render = methods[gameObject.type].bind(gameObject);
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render() {
    // pre-rendering
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

    this.clearCanvas();
    this.game.gameArea.render(this.ctx, this.game.camera);
    this.game.dots.forEach(dot => dot.render(this.ctx, this.game.camera));
    this.game.snakes.forEach(snake => snake.render(this.ctx, this.game.camera));
  }
}
