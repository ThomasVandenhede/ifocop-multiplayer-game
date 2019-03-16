import AABB from "./aabb.js";

export default class Renderer {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
  }

  register(gameObject) {
    const methods = {
      Player: function(ctx, camera) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.lineWidth = camera.applyToDistance(5);
        for (let index = this.positions.length - 1; index >= 0; index--) {
          const self = this.positions;
          const position = self[index];
          const boundingRect = new AABB({
            x: position.x,
            y: position.y,
            width: this.radius,
            height: this.radius
          });

          // rendering body part only if it's visible in viewport
          if (boundingRect.overlaps(camera)) {
            ctx.beginPath();
            ctx.arc(
              camera.applyToX(position.x),
              camera.applyToY(position.y),
              camera.applyToDistance(this.radius),
              0,
              Math.PI * 2
            );
            ctx.fill();

            // ctx.beginPath();
            // ctx.arc(
            //   camera.applyToX(position.x + this.radius),
            //   camera.applyToY(position.y + this.radius),
            //   // position.x + this.radius,
            //   // position.y + this.radius,
            //   3,
            //   0,
            //   Math.PI * 2
            // );
            ctx.fill();
            ctx.stroke();
          }
        }
        ctx.restore();
      },

      GameArea: function(ctx, camera) {
        ctx.save();
        let minX =
          camera.x -
          (camera.x % window.background.width) -
          window.background.width;
        let minY =
          camera.y -
          (camera.y % window.background.height) -
          window.background.height;

        for (let x = minX; x < camera.right; x += window.background.width) {
          for (let y = minY; y < camera.bottom; y += window.background.height) {
            ctx.drawImage(
              window.background,
              camera.applyToX(x),
              camera.applyToY(y),
              camera.applyToDistance(window.background.width),
              camera.applyToDistance(window.background.height)
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
      }
    };

    // add a render method to a game object based on its type
    gameObject.render = methods[gameObject.type].bind(gameObject);
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render() {
    this.clearCanvas();
    this.game.gameArea.render(this.ctx, this.game.camera);
    this.game.gameObjects.forEach(gameObject => {
      gameObject.render(this.ctx, this.game.camera);
    });
  }
}
