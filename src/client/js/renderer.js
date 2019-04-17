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
  }

  renderPellet(pellet, ctx, camera) {
    ctx.fillStyle = `hsl(${pellet.hue}, 100%, 69%)`;
    ctx.beginPath();
    ctx.arc(
      camera.applyToX(pellet.x),
      camera.applyToY(pellet.y),
      camera.applyToDistance(pellet.r),
      0,
      PI2
    );
    ctx.fill();
  }

  renderSnake(snake, ctx, camera) {
    // const segmentCount = snake.segments.length;
    const snakeImages = this.game.snakeImages[snake.id];
    const nameImg = snakeImages.name;
    const body = snakeImages.body;
    const spriteCount = body.width / body.height;

    // draw snake
    ctx.lineWidth = camera.applyToDistance(snake.radius * 2);

    for (let i = snake.segments.length - 2; i >= 0; i--) {
      const segment = snake.segments[i];
      ctx.drawImage(
        body,
        body.height * (i % spriteCount),
        0,
        body.height,
        body.height,
        camera.applyToX(segment.x - snake.radius),
        camera.applyToY(segment.y - snake.radius),
        camera.applyToDistance(snake.radius * 2),
        camera.applyToDistance(snake.radius * 2)
      );
      // if (snake.speed > snake.BASE_SPEED) {
      //   const t =
      //     (snake.speed - snake.BASE_SPEED) /
      //     (snake.MAX_SPEED - snake.BASE_SPEED);

      //   ctx.shadowBlur = camera.applyToDistance(50) * t;
      //   ctx.shadowColor = "red";
      //   ctx.fill();
      // }
    }
    // ctx.shadowBlur = 0; // default
    // ctx.shadowColor = "rgba(0, 0, 0, 0)"; // default

    // display player name
    ctx.drawImage(
      nameImg,
      camera.applyToX(snake.x) - nameImg.width / 2,
      camera.applyToY(snake.y + snake.radius) + 15
    );
  }

  cropBoundary(ctx, camera) {
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(
      camera.applyToX(this.game.world.x),
      camera.applyToY(this.game.world.y),
      camera.applyToDistance(this.game.world.r),
      0,
      PI2
    );
    ctx.fill();
    ctx.globalCompositeOperation = "source-over"; // default
  }

  renderBoundary(ctx, camera) {
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
    ctx.closePath();
    ctx.stroke();
  }

  clearCanvases() {
    this.preCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render() {
    this.clearCanvases();

    this.preCtx.lineWidth = 1; // default
    this.game.grid.draw(this.preCtx, this.game.camera);
    this.game.pellets.forEach(pellet => {
      var boundingRect = new AABB({
        x: pellet.x - pellet.r,
        y: pellet.y - pellet.r,
        width: pellet.r * 2,
        height: pellet.r * 2
      });
      if (boundingRect.overlaps(this.game.camera)) {
        this.renderPellet(pellet, this.preCtx, this.game.camera);
      }
    });
    this.game.snakes.forEach(snake =>
      this.renderSnake(snake, this.preCtx, this.game.camera)
    );
    this.cropBoundary(this.preCtx, this.game.camera);
    this.renderBoundary(this.preCtx, this.game.camera);

    // Render our off-screen canvas to the visible canvas.
    this.ctx.drawImage(this.pre, 0, 0);
  }
}
