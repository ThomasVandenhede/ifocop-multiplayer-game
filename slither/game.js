const GameTimer = require("./gameTimer.js").GameTimer;
const Snake = require("./snake.js");
const utils = require("./utils.js");
const Circle = require("./geometry/circle");

class Game {
  constructor(io) {
    // socket.io
    this.io = io;
    this.connections = {};

    // game timer
    this.timer = new GameTimer();

    // game objects
    this.snakes = [];
    this.dots = [];

    this.setupSocketEvents();

    this.world = new Circle(0, 0, 2000);
  }

  setupSocketEvents() {
    this.io.on("connection", socket => {
      console.log("new connection: ", socket.id);

      this.connections[socket.id] = {
        socket
      };

      this.snakes.push(new Snake(this, socket.id));

      // notify all clients about the new connection
      this.io.emit("clientConnection", this.getGameState());

      socket.on("clientUpdate", ({ inputState: { keys } }) => {
        const snake = this.snakes.find(snake => snake.id === socket.id);

        // update snake's positiond
        snake.isBoosting = keys.UP || keys.SPACE;
        if (keys.LEFT) {
          snake.dir -= 3 / (snake.radius / Snake.INITIAL_RADIUS);
        }
        if (keys.RIGHT) {
          snake.dir += 3 / (snake.radius / Snake.INITIAL_RADIUS);
        }
      });

      socket.on("disconnect", () => {
        // delete snake
        this.snakes = this.snakes.filter(snake => snake.id !== socket.id);

        // delete connection
        delete this.connections[socket.id];

        // notify client
        this.io.emit("clientDisconnect", socket.id);
      });
    });
  }

  update() {
    this.timer.update();
    const dt = utils.toFixedPrecision(this.timer.getEllapsedTime() / 1000, 2);

    this.snakes.forEach(snake => {
      snake.update(dt);
    });

    // notify client about new game state
    this.io.emit("update", this.getGameState());
  }

  getGameState() {
    return {
      snakes: this.snakes.map(snake => {
        var { game, ...onlySnake } = snake;
        return onlySnake;
      }),
      dots: this.dots
    };
  }

  gameLoop() {
    this.update();
    setTimeout(this.gameLoop.bind(this), 1000 / 30);
  }
}

module.exports.Game = Game;
