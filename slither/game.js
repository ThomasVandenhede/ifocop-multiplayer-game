const GameTimer = require("./gameTimer.js").GameTimer;
const Snake = require("./snake.js");
const utils = require("./utils.js");
const Circle = require("./geometry/circle");
const Dot = require("./dot");

class Game {
  constructor(io) {
    // socket.io
    this.io = io;
    this.connections = {};

    // game world
    this.world = new Circle(0, 0, 4000);
    this.world.type = "World";

    // game timer
    this.timer = new GameTimer();

    // game objects
    this.snakes = [];
    this.dots = [...Array(500)].map(_ => {
      const radius = 10;
      const alpha = utils.randInt(0, 360);
      const r = utils.randInt(0, this.world.r - radius);
      return new Dot(
        this,
        Math.cos(utils.degreeToRad(alpha)) * r,
        Math.sin(utils.degreeToRad(alpha)) * r,
        utils.randInt(5, 9)
      );
    });

    this.setupSocketEvents();
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

      socket.on("clientUpdate", ({ inputState: { keys }, player }) => {
        const snake = this.snakes.find(snake => snake.id === socket.id);

        // update snake's body based on client data
        for (let i = 1; i < snake.segments.length; i++) {
          const segment = snake.segments[i];
          segment.moveTo(player.segments[i].x, player.segments[i].y);
        }

        // process user input
        snake.isBoosting = keys.UP || keys.SPACE;
        if (keys.LEFT) {
          snake.dir -= (8 * snake.INITIAL_RADIUS) / snake.radius;
        }
        if (keys.RIGHT) {
          snake.dir += 8 / (snake.radius / snake.INITIAL_RADIUS);
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
      world: this.world,
      // avoid circular references
      snakes: this.snakes.map(snake => {
        var { game, ...onlySnake } = snake;
        return onlySnake;
      }),
      // same
      dots: this.dots.map(dot => {
        var { game, ...onlyDot } = dot;
        return onlyDot;
      })
    };
  }

  gameLoop() {
    this.update();
    setTimeout(this.gameLoop.bind(this), 1000 / 30);
  }
}

module.exports.Game = Game;
