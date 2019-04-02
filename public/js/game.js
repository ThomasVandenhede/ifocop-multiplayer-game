import Camera from "./camera.js";
import KeyboardManager from "./keyboardManager.js";
import Renderer from "./renderer.js";

export default class Game {
  constructor(socket) {
    // canvas
    this.canvas = document.getElementById("canvas");

    // renderer
    this.renderer = new Renderer(this);

    // game objects
    this.dots = [];
    this.snakes = [];
    this.gameArea = {
      type: "GameArea",
      x: 0,
      y: 0,
      r: 2000
    };
    this.renderer.register(this.gameArea);

    // input management
    this.keyboardInput = new KeyboardManager();

    // camera
    this.camera = new Camera({ canvas: this.canvas });

    // socket
    this.socket = socket;

    this.socket.on("clientConnection", gameState => {
      const { snakes, dots } = gameState;
      console.log("TCL: Game -> constructor -> snakes", snakes);
      this.updateScene(snakes);
    });

    this.socket.on("update", gameState => {
      const { snakes, dots } = gameState;

      this.updateScene(snakes);

      this.update();
      this.render();
    });
  }

  updateScene(snakes) {
    this.snakes = snakes;
    snakes.forEach(snake => {
      this.renderer.register(snake);
    });
  }

  getPlayer() {
    return this.snakes.find(snake => {
      return snake.id === this.socket.id;
    });
  }

  /**
   * Update viewport (camera) and send input to server.
   */
  update() {
    const player = this.getPlayer();
    this.camera.update();

    if (player) {
      this.camera.center(player.segments[0].x, player.segments[0].y);
      this.socket.emit("clientUpdate", {
        inputState: { keys: this.keyboardInput.keys },
        player
      });
    }
  }

  /**
   * Draw to the canvas.
   */
  render() {
    this.renderer.render();
  }

  start() {
    window.snake = new Image();
    window.snake.src = "/images/snake-body.png";
    window.background = new Image();
    window.background.src = "/images/bg54.jpg";
    window.background.onload = function() {
      this.main();
    }.bind(this);
  }

  /**
   * The main game loop.
   */
  main() {
    // notify server about input devices
    this.update();
    this.render();
  }
}
