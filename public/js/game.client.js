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

    // build game
    this.socket.on("server-start-game", json => {
      this.joinRequested = false;
      this.inGame = true;

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

      this.create();
    });

    this.socket.on("server-game-over", () => {
      const menuContainer = document.getElementById("menu-container");

      window.ontransitionend = () => {
        const gameContainer = document.getElementById("game-container");
        gameContainer.style.dislay = "none";

        // stop game
        this.stop();
        // ask server to get unsubscribe us from game updates
        this.socket.emit("client-leave-game");
        // prevent calling this event listener again
        window.ontransitionend = null;

        this.transitionRunning = false;
        this.inGame = false;

        // defer joining game until after all transitions have finished.
        if (this.joinRequested) {
          this.join();
        }
      };

      // trigger transition
      menuContainer.style.display = "block";
      setTimeout(() => {
        menuContainer.classList.remove("fade-out");
        window.animatedBackground.start();
        this.transitionRunning = true;
      }, 10);
    });

    // Server has updated the game state:
    // - new dots
    // - snake heads
    // - potential collisions
    this.socket.on("server-update", gameStateJSON => {
      this.processServerUpdate(JSON.parse(gameStateJSON));
      this.getPlayer() && this.processClientInput();
    });
  }

  requestJoin() {
    // do not allow requesting twice!
    if (this.joinRequested || this.inGame) return;

    //
    this.joinRequested = true;
    if (!this.transitionRunning) {
      this.join();
    }
  }

  join() {
    this.joinRequested = false;
    const menuContainer = document.getElementById("menu-container");
    const gameContainer = document.getElementById("game-container");
    window.ontransitionend = () => {
      menuContainer.style.display = "none";
      window.ontransitionend = null;
    };
    menuContainer.classList.add("fade-out");

    gameContainer.style.display = "block";
    this.socket.emit("client-join-game");
  }

  getPlayer() {
    return this.snakes.find(snake => snake.id === this.socket.id);
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

    if (!this.player) return;

    this.snakes.forEach(snake => {
      this.renderer.register(snake);
    });

    // update camera
    this.camera.zoomLevel =
      1.15 * Math.pow(this.player.INITIAL_RADIUS / this.player.radius, 1 / 2);
    this.camera.update();
    this.camera.center(this.player.segments[0].x, this.player.segments[0].y);
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
      { src: "/images/snake-body2.png", name: "snake" },
      { src: "/images/bg54.jpg", name: "background" }
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
  createRenderLoop() {
    const renderLoop = () => {
      this.frame = requestAnimationFrame(renderLoop);
      // notify server about input devices
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
    // stop render loop
    this.renderLoop.stop();

    // stop score loop
    this.scoreLoop.stop();
  }
}
