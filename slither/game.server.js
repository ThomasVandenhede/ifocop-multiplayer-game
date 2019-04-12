const randomize = require("./randomize.js");
const GameTimer = require("./gameTimer.js").GameTimer;
const Snake = require("./snake.js");
const utils = require("./utils.js");
const Circle = require("./geometry/circle.js");
const Dot = require("./dot.js");

class Game {
  constructor(io) {
    // Socket.io
    this.io = io;
    this.connections = {};

    // Game world
    this.world = new Circle(0, 0, 2000);
    this.world.type = "World";

    // Game timer
    this.timer = new GameTimer();

    // Client actions sorted by socket ID. Example:
    // {
    //   "1234": [
    //     { frameDuration: 16, action: "LEFT" },
    //     { frameDuration: 18, action: "RIGHT" },
    //     { frameDuration: 18, action: "SET_TARGET", data: { dir: 145 } }
    //   ]
    // }
    this.clientInput = {};

    // Game objects
    this.snakes = [];
    this.dots = [];
    this.MAX_DOT_COUNT = 200;
    for (let i = 0; i < this.MAX_DOT_COUNT; i++) {
      this.spawnRandomDot();
    }

    this.setupSocketEvents();
  }

  spawnRandomDot() {
    let x, y, alpha, r;
    let color = randomize.hsl();

    alpha = utils.randInt(0, 360);
    r = utils.randInt(0, this.world.r - 50);
    x = Math.cos(utils.degToRad(alpha)) * r;
    y = Math.sin(utils.degToRad(alpha)) * r;

    this.dots.push(new Dot(this, x, y, 3, color));
  }

  spawnSnake(id) {
    this.snakes.push(new Snake(this, id));
  }

  getSnakeById(id) {
    return this.snakes.find(snake => snake.id === id);
  }

  setupSocketEvents() {
    this.io.on("connection", socket => {
      console.log("new connection: ", socket.id);

      // Save new connection
      this.connections[socket.id] = {
        socket
      };

      socket.on("join game", () => {
        // Add new snake
        this.spawnSnake(socket.id);

        // Notify all clients about the new connection
        socket.emit("startGameClient", this.getGameStateAsJSON());
        socket.join("game");
      });

      socket.on("client-input", ({ player, actions }) => {
        // const snake = this.getSnakeById(socket.id);

        // // Update snake's body based on client data
        // for (let i = 1; i < snake.segments.length; i++) {
        //   snake.segments[i] = player.segments[i];
        // }

        // Organize player input by socket ID.
        this.clientInput[socket.id] = [
          ...(this.clientInput[socket.id] || []),
          ...actions
        ];
      });

      socket.on("leave game", () => {
        socket.leave("game");
      });

      socket.on("disconnect", () => {
        // Delete snake
        this.snakes = this.snakes.filter(snake => snake.id !== socket.id);

        // Delete connection
        delete this.connections[socket.id];

        // Notify client
        this.io.emit("clientDisconnect", socket.id);
      });
    });
  }

  getGameStateAsJSON() {
    const gameState = {
      timestamp: Date.now(),
      world: this.world,
      snakes: this.snakes,
      dots: this.dots
    };

    // Avoid circular references
    return JSON.stringify(gameState, (key, value) => {
      if (key === "game") {
        // omit game reference from within snakes
        return undefined;
      } else if (key === "snake") {
        // omit snake reference from within snake segments
        return undefined;
      } else {
        return value;
      }
    });
  }

  step() {
    this.update();
    setTimeout(this.step.bind(this), 1000 / 30);
  }

  update() {
    this.timer.update();
    const dt = utils.toFixedPrecision(this.timer.getEllapsedTime() / 1000, 2);

    this.handleClientInput();

    this.snakes.forEach(snake => snake.update(dt));
    this.dots.forEach(dot => dot.update(dt));

    // notify client in the game about new game state
    this.io.to("game").emit("server-update", this.getGameStateAsJSON());
  }

  /**
   * Convert each client action into a player command.
   */
  handleClientInput() {
    for (let socketID in this.clientInput) {
      const player = this.getSnakeById(socketID);
      if (player) {
        this.clientInput[socketID].forEach(action => {
          const { frameDuration, command, data } = action;
          if (command === "RIGHT") {
            player.target = player.dir += player.steering * frameDuration;
          }
          if (command === "LEFT") {
            player.target = player.dir -= player.steering * frameDuration;
          }
          if (command === "BOOST_START") {
            player.isBoosting = true;
          }
          if (command === "BOOST_STOP") {
            player.isBoosting = false;
          }
          if (command === "SET_TARGET") {
            player.target = data.dir;
          }
        });
      }
    }
    this.emptyClientInput();
  }

  emptyClientInput() {
    this.clientInput = {};
  }
}

module.exports.Game = Game;
