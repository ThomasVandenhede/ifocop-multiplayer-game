import Camera from "./camera.js";
import KeyboardManager from "./keyboardManager.js";
import Renderer from "./renderer.js";

export default class Game {
  constructor(socket) {
    this.player = null;

    // canvas
    this.canvas = document.getElementById("canvas");

    // renderer
    this.renderer = new Renderer(this);

    // game objects
    this.gameObjects = [];
    this.gameArea = {
      type: "GameArea",
      x: 0,
      y: 0,
      r: 2000
    };
    this.renderer.register(this.gameArea);

    // input management
    this.km = new KeyboardManager();

    // camera
    this.camera = new Camera({ canvas: this.canvas });

    // socket
    this.socket = socket;

    this.socket.on("clientConnection", gameObjects => {
      this.updateScene(gameObjects);

      this.player = this.gameObjects.find(gameObject => {
        return gameObject.id === this.socket.id;
      });
    });

    this.socket.on("update", gameState => {
      const { players } = gameState;

      this.updateScene(players);
      this.player = this.gameObjects.find(player => {
        return player.id === this.socket.id;
      });
    });
  }

  updateScene(gameObjects) {
    this.gameObjects = gameObjects;
    gameObjects.forEach(gameObject => {
      // rebuild full Player from data received from the server
      this.renderer.register(gameObject);
    });
  }

  /**
   * Update viewport (camera) and send input to server.
   */
  update() {
    this.socket.emit("inputState", { keys: this.km.keys });
    this.camera.update();
    if (this.player) {
      const head = this.player.positions[0];
      this.camera.center(head.x, head.y);
    }
  }

  /**
   * Draw to the canvas.
   */
  render() {
    this.renderer.render();
  }

  start() {
    window.gbg = new Image();
    window.gbg.src = "/images/gbg.jpg";
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

    requestAnimationFrame(this.main.bind(this));
  }
}
