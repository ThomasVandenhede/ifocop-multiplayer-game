const GameTimer = require("./gameTimer.js").GameTimer;
const Snake = require("./snake.js");
const utils = require("../../shared/utils.js");
const Circle = require("./geometry/circle.js");
const Dot = require("./dot.js");
const mongodb = require("mongodb");
const db = require("../db.js");

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
    let hue = utils.randInt(0, 359);

    alpha = utils.randInt(0, 360);
    r = utils.randInt(0, this.world.r - 50);
    x = Math.round(Math.cos(utils.degToRad(alpha)) * r);
    y = Math.round(Math.sin(utils.degToRad(alpha)) * r);

    this.dots.push(new Dot(this, x, y, 3, hue));
  }

  spawnSnake(id) {
    const newSnake = new Snake(this, id);
    this.snakes.push(newSnake);
    return newSnake;
  }

  getSnakeById(id) {
    return this.snakes.find(snake => snake.id === id);
  }

  removePlayer(id) {
    this.snakes = this.snakes.filter(snake => snake.id !== id);
  }

  setupSocketEvents() {
    this.io.on("connection", socket => {
      console.log("new connection: ", socket.id);

      // Save new connection
      this.connections[socket.id] = {
        socket
      };

      socket.on("client-join-game", viewport => {
        // Create new snake
        const snake = this.spawnSnake(socket.id);
        snake.viewport = viewport;

        // Inform the player about the current state of the game
        socket.emit("server-start-game", this.getFullGameStateAsJSON());

        // Finally let the player enter the game
        socket.join("game");
      });

      socket.on("client-input", ({ player, actions }) => {
        // Organize player input by socket ID.
        this.clientInput[socket.id] = [
          ...(this.clientInput[socket.id] || []),
          ...actions
        ];
      });

      socket.on("client-leave-game", () => {
        // finally leave game
        socket.leave("game");
        console.log(`player ${socket.id} has left the game`);
      });

      socket.on("disconnect", () => {
        // Delete connection
        delete this.connections[socket.id];

        // Delete snake
        this.removePlayer(socket.id);

        // Notify client
        this.io.emit("clientDisconnect", socket.id);
      });
    });
  }

  getFullGameStateAsJSON() {
    const gameState = {
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

  getGameStateAsJSON() {
    const gameState = {
      snakes: this.snakes
        .filter(snake => !snake.isDead)
        .map(snake => ({
          ...snake,
          segments: snake.segments.reduce(
            (acc, segment) => [...acc, segment.x, segment.y, segment.dir],
            []
          )
        })),
      dots: this.dots.reduce(
        (acc, dot) => [...acc, dot.x, dot.y, dot.r, dot.hue],
        []
      )
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

    this.sendUpdate();
  }

  sendUpdate() {
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

  handleGameOver(id) {
    console.log("game over");
    const socket = this.io.sockets.connected[id];

    if (socket && socket.handshake.session) {
      const { userID } = socket.handshake.session;
      const dbClient = db.getInstance().db("slither");
      const usersCollection = dbClient.collection("users");
      const player = this.getSnakeById(socket.id);

      // update player's best score and max number of kills
      usersCollection
        .findOne({ _id: new mongodb.ObjectID(userID) })
        .then(user => {
          if (user) {
            if (!user.max_score || user.max_score < player.mass)
              usersCollection.updateOne(
                {
                  _id: new mongodb.ObjectID(userID)
                },
                {
                  $set: {
                    max_score: player.mass
                  }
                }
              );
          }
          console.log("player score saved");

          // remove player
          this.removePlayer(socket.id);

          socket.emit("server-game-over");
        });
    }
  }

  emptyClientInput() {
    this.clientInput = {};
  }
}

module.exports.Game = Game;
