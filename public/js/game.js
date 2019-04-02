import Camera from "./camera.js";
import KeyboardManager from "./keyboardManager.js";
import Renderer from "./renderer.js";

export default class Game {
  constructor(socket) {
    this.preloading = false;

    // canvas
    this.canvas = document.getElementById("canvas");

    // renderer
    this.renderer = new Renderer(this);

    // game objects
    this.dots = [];
    this.snakes = [];

    // input management
    this.keyboardInput = new KeyboardManager();

    // camera
    this.camera = new Camera({ canvas: this.canvas });

    // socket
    this.socket = socket;

    this.socket.on("clientConnection", gameState => {
      const { snakes, dots, world } = gameState;
      this.world = world;
      this.renderer.register(this.world);

      this.start();
    });

    this.socket.on("update", gameState => {
      if (this.preloading) return;

      const { snakes, dots } = gameState;
      this.updateScene(snakes, dots);

      this.update();
      this.render();
    });
  }

  updateScene(snakes, dots) {
    this.snakes = snakes;
    this.dots = dots;
    snakes.forEach(snake => {
      this.renderer.register(snake);
    });
    dots.forEach(dot => {
      this.renderer.register(dot);
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

  preload(...resources) {
    const tasks = [];

    const knowExtensions = {
      image: ["png", "gif", "jpg", "jpeg"],
      sound: ["mp3"]
    };
    resources.forEach(resource => {
      const ext = resource.src.split(".")[1];
      tasks.push(
        new Promise((resolve, reject) => {
          if (knowExtensions.image.includes(ext)) {
            const image = new Image();
            image.src = resource.src;
            image.onload = function() {
              window[resource.name] = image;
              resolve();
            };
          }
        })
      );
    });

    return Promise.all(tasks);
  }

  start() {
    this.preloading = true;
    this.preload(
      { src: "/images/snake-body.png", name: "snake" },
      { src: "/images/bg54.jpg", name: "background" }
    ).then(() => {
      this.preloading = false;
      this.main();
    });
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
