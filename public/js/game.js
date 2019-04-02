import Camera from "./camera.js";
import KeyboardManager from "./keyboardManager.js";
import Renderer from "./renderer.js";
import * as utils from "./utils.js";

export default class Game {
  constructor(socket) {
    this.preloading = false;

    // canvas
    this.canvas = document.getElementById("snakes");

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

    //
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

  createBackgroundSprite() {
    const bgCanvas = document.createElement("canvas");
    bgCanvas.width = this.world.r * 2;
    bgCanvas.height = this.world.r * 2;
    const bgCtx = bgCanvas.getContext("2d");
    const {
      width: backgroundWidth,
      height: backgroundHeight
    } = window.background;

    bgCtx.save();

    // draw hexagons
    for (let x = 0; x < this.world.r * 2; x += backgroundWidth) {
      for (let y = 0; y < this.world.r * 2; y += backgroundHeight) {
        bgCtx.drawImage(
          window.background,
          x,
          y,
          backgroundWidth,
          backgroundHeight
        );
      }
    }
    bgCtx.globalCompositeOperation = "destination-in";

    // crop hexagons to circle
    bgCtx.beginPath();
    bgCtx.arc(this.world.r, this.world.r, this.world.r, 0, Math.PI * 2);
    bgCtx.fill();
    bgCtx.restore();

    // draw outer border
    bgCtx.save();
    bgCtx.strokeStyle = "#7E0000";
    bgCtx.lineWidth = 10;
    bgCtx.beginPath();
    bgCtx.arc(this.world.r, this.world.r, this.world.r, 0, Math.PI * 2);
    bgCtx.stroke();
    bgCtx.restore();

    window.bgCanvas = bgCanvas;
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
      this.createBackgroundSprite();
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
