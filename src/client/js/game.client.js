import Camera from "./camera.js";
import Keyboard from "./keyboard/Keyboard.js";
import Mouse from "./Mouse.js";
import Renderer from "./renderer.js";
import Grid from "./grid.js";

export default class Game {
  constructor(socket) {
    // DOM score elements
    this.scoreEl = document.getElementById("score");
    this.rankEl = document.getElementById("rank");

    // time
    this.then = this.now = Date.now();

    // canvas
    this.canvas = document.getElementById("canvas");

    // renderer
    this.renderer = new Renderer(this);
    this.grid = new Grid(100);

    // game objects
    this.pellets = [];
    this.snakes = [];
    this.player = null; // reference to us, the player

    // Store snake images to optimize rendering.
    // { snakeId: { name: name_image_data, body: body_image_data }, ...}
    this.snakeImages = {};

    // input management
    this.keyboard = new Keyboard();
    this.mouse = new Mouse({ element: this.canvas, callbackContext: this });
    this.mouse.mouseMoveCallback = function() {
      const canvasBoundingRect = this.canvas.getBoundingClientRect();
      const mOffsetX = Math.floor(this.mouse.x - canvasBoundingRect.width / 2);
      const mOffsetY = Math.floor(this.mouse.y - canvasBoundingRect.height / 2);
      const dir = Math.atan2(mOffsetY, mOffsetX);

      this.actions.push({
        frameDuration: this.dt,
        command: "SET_TARGET",
        data: { dir }
      });
      this.sendClientInput();
    };

    // input messages
    this.lastInputMessageTime = Date.now();
    this.inputMessageInterval = 250; // ms

    // is a transition running?
    this.transitionRunning = false;

    // has the player requested to join the game?
    this.joinRequested = false;
    this.inGame = false;

    // camera
    this.camera = new Camera({ canvas: this.canvas });

    // socket
    this.socket = socket;

    // Player actions. a packet of actions to be sent to the websocket server.
    this.actions = [];
  }

  requestJoin() {
    this.joinRequested = false;

    // do not allow requesting twice!
    if (this.joinRequested || this.inGame) return;

    //
    this.joinRequested = true;
    if (!this.transitionRunning) {
      this.join();
    }
  }

  join() {
    this.socket.send(encode("c-join-game"));
  }

  getPlayer() {
    return this.snakes.find(snake => snake.id === this.socket.id);
  }

  /**
   * Apply server game state.
   */
  processServerUpdate(gameState) {
    this.pellets = this.decodePellets(gameState.pellets);
    this.snakes = this.decodeSnakes(gameState.snakes);
    this.player = this.snakes.find(snake => snake.id === this.socket.id);

    if (!this.player) return;

    // update camera
    const ratio = this.player.radius / this.player.INITIAL_RADIUS;
    this.camera.zoomLevel = 1.15 * Math.pow(ratio, -0.3);
    this.camera.update();
    this.camera.center(this.player.segments[0].x, this.player.segments[0].y);
  }

  decodeSnakes(snakes) {
    const decodedSnakes = [];
    for (let i = 0; i < snakes.length; i++) {
      const snake = snakes[i];
      const decodedSegments = [];
      for (let j = 0; j < snake.segments.length; j += 3) {
        decodedSegments.push({
          x: snake.segments[j],
          y: snake.segments[j + 1],
          dir: snake.segments[j + 2]
        });
      }
      snake.segments = decodedSegments;
      decodedSnakes.push(snake);
    }
    return decodedSnakes;
  }

  decodePellets(pellets) {
    const decodedPellets = [];
    for (let i = 0; i < pellets.length; i += 4) {
      decodedPellets.push({
        x: pellets[i],
        y: pellets[i + 1],
        r: pellets[i + 2],
        hue: pellets[i + 3],
        type: "Pellet"
      });
    }
    return decodedPellets;
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
        new Promise(resolve => {
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

  create() {
    this.preloading = true;
    this.preload(
      { src: "/client/images/snake-body2.png", name: "snake" },
      { src: "/client/images/bg54.jpg", name: "background" }
    ).then(() => {
      this.start();
    });
  }

  start() {
    this.scoreLoop = this.createScoreLoop(1);
    this.renderLoop = this.createRenderLoop();
  }

  createScoreLoop(fps) {
    const intervalID = setInterval(() => {
      if (this.player) {
        this.scoreEl.innerHTML = this.player.mass;
      }
    }, 1000 / fps);

    return {
      stop: () => {
        clearInterval(intervalID);
      }
    };
  }

  sendClientInput() {
    if (
      this.actions &&
      this.actions.length &&
      Date.now() - this.lastInputMessageTime >= this.inputMessageInterval
    ) {
      this.socket.send(
        encode("c-input") +
          JSON.stringify({
            actions: this.actions
          })
      );
      this.clearActions();
      this.lastInputMessageTime = Date.now();
    }
  }

  /**
   * Empty action packet.
   */
  clearActions() {
    this.actions = [];
  }

  /**
   * The main game loop.
   */
  createRenderLoop() {
    const renderLoop = () => {
      this.frame = requestAnimationFrame(renderLoop);
      this.render();
    };
    renderLoop();

    return {
      stop: () => {
        cancelAnimationFrame(this.frame);
      }
    };
  }

  /**
   * Draw to the canvas.
   */
  render() {
    this.renderer.render();
  }

  processClientInput() {
    this.then = this.now;
    this.now = Date.now();
    this.dt = (this.now - this.then) / 1000;

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
      !this.player.isBoosting &&
        this.actions.push({ frameDuration: this.dt, command: "BOOST_START" });
    } else {
      this.player.isBoosting &&
        this.actions.push({ frameDuration: this.dt, command: "BOOST_STOP" });
    }
    this.sendClientInput();
  }

  stop() {
    // remove event listeners
    this.keyboard.removeEventListeners();
    this.mouse.removeEventListeners();

    // stop render loop
    this.renderLoop && this.renderLoop.stop();

    // stop score loop
    this.scoreLoop && this.scoreLoop.stop();
  }
}
