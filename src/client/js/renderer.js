import AABB from "./aabb.js";
import { PI2 } from "./constants.js";

export default class Renderer {
  constructor(game) {
    this.game = game;

    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");

    this.pre = document.createElement("canvas");
    this.pre.width = this.canvas.width;
    this.pre.height = this.canvas.height;
    this.preCtx = this.pre.getContext("2d");
    this.preCtx.textAlign = "center";
    this.preCtx.font = "24px arial";
  }

  register(gameObject) {
    const methods = {
      Dot: function(ctx, camera) {
        ctx.save();
        ctx.fillStyle = `hsl(${this.hue}, 100%, 69%)`;

        ctx.beginPath();
        ctx.arc(
          camera.applyToX(this.x),
          camera.applyToY(this.y),
          camera.applyToDistance(this.r),
          0,
          PI2
        );
        ctx.fill();
        ctx.restore();
      },
      Snake: function(ctx, camera) {
        const segmentCount = this.segments.length;

        // draw snake
        ctx.save();
        ctx.lineCap = ctx.lineJoin = "round";
        ctx.strokeStyle = `hsl(${this.hue}, 100%, 69%)`;

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
        if (this.speed > this.BASE_SPEED) {
          const t =
            (this.speed - this.BASE_SPEED) / (this.MAX_SPEED - this.BASE_SPEED);

          ctx.shadowBlur = camera.applyToDistance(this.radius * 4) * t;
          ctx.shadowColor = `hsl(${this.hue}, 100%, 69%)`;
          ctx.stroke();
          ctx.stroke();
        }

        // display player name
        ctx.fillStyle = "white";
        ctx.fillText(
          this.name,
          camera.applyToX(this.x),
          camera.applyToY(this.y + this.radius) + 30
        );
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

  cropBoundary(ctx, camera) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";

    // crop hexagons to circle
    ctx.beginPath();
    ctx.arc(
      camera.applyToX(this.game.world.x),
      camera.applyToY(this.game.world.y),
      camera.applyToDistance(this.game.world.r),
      0,
      PI2
    );
    ctx.fill();
    ctx.restore();
  }

  renderBoundary(ctx, camera) {
    ctx.save();
    ctx.lineWidth = camera.applyToDistance(10);
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.arc(
      camera.applyToX(this.game.world.x),
      camera.applyToY(this.game.world.y),
      camera.applyToDistance(this.game.world.r),
      0,
      PI2
    );
    ctx.stroke();
    ctx.restore();
  }

  clearCanvases() {
    this.preCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render() {
    this.clearCanvases();

    // Render grid
    this.game.grid.draw(this.preCtx, this.game.camera);

    // Render dots
    this.game.dots.forEach(dot => {
      var boundingRect = new AABB({
        x: dot.x - dot.r,
        y: dot.y - dot.r,
        width: dot.r * 2,
        height: dot.r * 2
      });
      if (boundingRect.overlaps(this.game.camera)) {
        dot.render(this.preCtx, this.game.camera);
      }
    });

    // Render snakes
    this.game.snakes.forEach(snake =>
      snake.render(this.preCtx, this.game.camera)
    );

    // Crop
    this.cropBoundary(this.preCtx, this.game.camera);

    // Render world boundary
    this.renderBoundary(this.preCtx, this.game.camera);

    // Render our off-screen canvas to the visible canvas.
    this.ctx.drawImage(this.pre, 0, 0);
  }
}
