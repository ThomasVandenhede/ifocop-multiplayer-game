import Camera from "./camera.js";
import Keyboard from "./keyboard/Keyboard.js";
import Mouse from "./Mouse.js";
import Renderer from "./renderer.js";
import { PI2 } from "./constants.js";
import Grid from "./grid.js";

export default class Game {
  constructor(socket) {
    // DOM score elements
    this.scoreEl = document.getElementById("score");
    this.rankEl = document.getElementById("rank");

    // time
    this.then = this.now = Date.now();

    // Boolean, is true when the player has entered the game.
    this.isReady = false;

    // canvas
    this.canvas = document.getElementById("canvas");

    // renderer
    this.renderer = new Renderer(this);
    this.grid = new Grid(100);

    // game objects
    this.dots = [];
    this.snakes = [];
    this.player = null; // reference to us, the player

    // input management
    this.keyboard = new Keyboard();
    this.mouse = new Mouse({ element: this.canvas, callbackContext: this });

    // input messages
    this.lastInputMessageTime = Date.now();
    this.inputMessageInterval = 250; // ms

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
      this.sendClientInput();
    };

    // camera
    this.camera = new Camera({ canvas: this.canvas });

    // socket
    this.socket = socket;

    // Player actions. a packet of actions to be sent to the websocket server.
    this.actions = [];

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
      this.player = this.snakes.find(snake => snake.id === this.socket.id);

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
      this.processServerUpdate(JSON.parse(gameStateJSON));
      this.processClientInput();
    });
  }

  /**
   * Apply server game state.
   */
  processServerUpdate(gameState) {
    // update dots
    this.dots = gameState.dots;
    this.dots.forEach(dot => {
      this.renderer.register(dot);
    });

    // // update opponents
    // const opponents = gameState.snakes.filter(
    //   snake => snake.id !== this.player.id
    // );

    // // update only player's head
    // const updatedPlayer = gameState.snakes.find(
    //   snake => snake.id === this.player.id
    // );

    // // update player's state
    // this.player.isBoosting = updatedPlayer.isBoosting;
    // this.player.radius = updatedPlayer.radius;

    // // bring all snakes together
    // this.snakes = [...opponents, this.player];
    this.snakes = gameState.snakes;
    this.player = this.snakes.find(snake => snake.id === this.socket.id);

    this.snakes.forEach(snake => {
      this.renderer.register(snake);
    });

    // update camera
    this.camera.zoomLevel =
      1.15 * Math.pow(this.player.INITIAL_RADIUS / this.player.radius, 1 / 2);
    this.camera.update();
    this.camera.center(this.player.segments[0].x, this.player.segments[0].y);
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

  start() {
    this.preloading = true;
    this.preload(
      { src: "/images/snake-body2.png", name: "snake" },
      { src: "/images/bg54.jpg", name: "background" }
    ).then(() => {
      this.isReady = true;
      this.createBackgroundSprite();
      this.scoreLoop = this.createScoreLoop(1);
      this.renderLoop();
    });
  }

  createScoreLoop(fps) {
    return setInterval(() => {
      if (this.player) {
        this.scoreEl.innerHTML = this.player.mass;
      }
    }, 1000 / fps);
  }

  sendClientInput() {
    if (
      this.actions &&
      this.actions.length &&
      Date.now() - this.lastInputMessageTime >= this.inputMessageInterval
    ) {
      this.socket.emit("client-input", {
        // player: this.player,
        actions: this.actions
      });
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
  renderLoop() {
    this.frame = requestAnimationFrame(this.renderLoop.bind(this));
    // notify server about input devices
    this.render();
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
}
