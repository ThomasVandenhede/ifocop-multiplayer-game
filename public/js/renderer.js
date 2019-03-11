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
        ctx.lineWidth = 1;
        for (let index = this.positions.length - 1; index >= 0; index--) {
          const self = this.positions;
          const position = self[index];
          ctx.beginPath();
          ctx.arc(
            camera.applyToX(position.x + this.radius),
            camera.applyToY(position.y + this.radius),
            this.radius * camera.zoomLevel,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      },

      GameArea: function(ctx, camera) {
        ctx.save();
        ctx.strokeStyle = "red";
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(
          camera.applyToX(this.x),
          camera.applyToY(this.y),
          this.r * camera.zoomLevel,
          0,
          Math.PI * 2
        );
        ctx.fill();
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
    this.clearCanvas();
    this.game.gameArea.render(this.ctx, this.game.camera);
    this.game.gameObjects.forEach(gameObject => {
      gameObject.render(this.ctx, this.game.camera);
    });
  }
}
