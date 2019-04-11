import Camera from "./camera.js";
import Keyboard from "./keyboard/Keyboard.js";
import Mouse from "./Mouse.js";
import Renderer from "./renderer.js";
import * as utils from "./utils.js";
import { PI2 } from "./constants.js";

export default class Game {
  constructor(socket) {
    // time
    this.then = this.now = Date.now();

    // Boolean, is true when the player has entered the game.
    this.isReady = false;

    // canvas
    this.canvas = document.getElementById("snakes");

    // renderer
    this.renderer = new Renderer(this);

    // game objects
    this.dots = [];
    this.snakes = [];

    // input management
    this.keyboard = new Keyboard();
    this.mouse = new Mouse({ element: this.canvas, callbackContext: this });

    this.mouse.mouseMoveCallback = function() {
      const mouseCenterOffsetX = this.mouse.x - this.canvas.width / 2;
      const mouseCenterOffsetY = this.mouse.y - this.canvas.height / 2;
      const dir =
        (Math.atan2(mouseCenterOffsetY, mouseCenterOffsetX) / PI2) * 360;

      this.actions.push({
        frameDuration: this.dt,
        command: "SET_TARGET",
        data: { dir }
      });
    };

    // camera
    this.camera = new Camera({ canvas: this.canvas });

    // socket
    this.socket = socket;

    // Player actions. A packet of actions to be sent to the websocket server.
    this.actions = [];

    // Server game state
    this.serverGameState = null;

    // build game
    this.socket.on("startGameClient", json => {
      const gameState = JSON.parse(json);
      const { snakes, dots, world } = gameState;
      // build game
      this.world = world;
      this.renderer.register(this.world);

      // build dots
      this.dots = dots;
      dots.forEach(dot => {
        this.renderer.register(dot);
      });

      // build snakes
      this.snakes = snakes;
      snakes.forEach(snake => {
        this.renderer.register(snake);
      });

      this.start();
    });

    this.socket.on("game over", () => {
      const loginEl = document.getElementById("login");

      this.socket.emit("leave game");
      loginEl.classList.remove("fade-out");
    });

    // Server has updated the game state:
    // - new dots
    // - snake heads
    // - potential collisions
    this.socket.on("server-update", gameStateJSON => {
      // if (!this.isReady) return;
      this.serverGameState = JSON.parse(gameStateJSON);
    });
  }

  /**
   * Method that retrives the curent player.
   * @returns {object} The player's snake
   */
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
    bgCtx.arc(this.world.r, this.world.r, this.world.r, 0, PI2);
    bgCtx.fill();
    bgCtx.restore();

    // draw outer border
    bgCtx.save();
    bgCtx.strokeStyle = "#7E0000";
    bgCtx.lineWidth = 10;
    bgCtx.beginPath();
    bgCtx.arc(this.world.r, this.world.r, this.world.r, 0, PI2);
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
      { src: "/images/snake-body2.png", name: "snake" },
      { src: "/images/bg54.jpg", name: "background" }
    ).then(() => {
      this.isReady = true;
      this.createBackgroundSprite();
      this.inputLoop = this.createInputLoop(4);
      this.updateLoop = this.createUpdateLoop(30);
      this.renderLoop();
    });
  }

  /**
   * Create a loop that perdiodically sends input packets to the websocket server.
   * @param {number} fps - The loop framerate
   * @returns {number} The interval ID
   */
  createInputLoop(fps) {
    return setInterval(() => {
      this.socket.emit("client-input", {
        player: this.getPlayer(),
        actions: this.actions
      });
      this.clearActions();
    }, 1000 / fps);
  }

  /**
   * Empty action packet.
   */
  clearActions() {
    this.actions = [];
  }

  createUpdateLoop(fps) {
    return setInterval(() => {
      this.update();
    }, 1000 / fps);
  }

  /**
   * The main game loop.
   */
  renderLoop() {
    this.frame = requestAnimationFrame(this.renderLoop.bind(this));
    // notify server about input devices
    this.render();
    return this.frame;
  }

  /**
   * Update viewport (camera) and send input to server.
   */
  update() {
    this.then = this.now;
    this.now = Date.now();
    this.dt = (this.now - this.then) / 1000;

    this.applyServerGameState();
    const player = this.getPlayer();

    // update camera
    this.camera.zoomLevel =
      1.15 * Math.pow(player.INITIAL_RADIUS / player.radius, 1 / 2);
    this.camera.update();
    this.camera.center(player.segments[0].x, player.segments[0].y);

    // Add action to actions packet
    if (this.keyboard.keys.ArrowRight.isPressed) {
      this.actions.push({ frameDuration: this.dt, command: "RIGHT" });
    }
    if (this.keyboard.keys.ArrowLeft.isPressed) {
      this.actions.push({ frameDuration: this.dt, command: "LEFT" });
    }
    if (
      this.keyboard.keys.Space.isPressed ||
      this.keyboard.keys.ArrowUp.isPressed ||
      this.mouse.buttons[0]
    ) {
      !player.isBoosting &&
        this.actions.push({ frameDuration: this.dt, command: "BOOST_START" });
    } else {
      player.isBoosting &&
        this.actions.push({ frameDuration: this.dt, command: "BOOST_STOP" });
    }
  }

  /**
   * Apply server game state.
   */
  applyServerGameState() {
    this.dots = this.serverGameState.dots;
    this.dots.forEach(dot => {
      this.renderer.register(dot);
    });
    this.snakes = this.serverGameState.snakes;
    this.snakes.forEach(snake => {
      this.renderer.register(snake);
    });
  }

  /**
   * Draw to the canvas.
   */
  render() {
    this.renderer.render();
  }
}
