const GameTimer = require("./gameTimer.js").GameTimer;
const Player = require("./player.js").Player;
const utils = require("./utils.js");

class Game {
  constructor(io) {
    // socket.io
    this.io = io;
    this.connections = {};

    // game timer
    this.timer = new GameTimer();

    // game objects
    this.players = [];
    this.gameObjects = [...this.players];

    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.io.on("connection", socket => {
      console.log("new connection: ", socket.id);

      this.connections[socket.id] = {
        socket
      };
      this.players.push(new Player(socket.id));

      // notify all clients about the new connection
      this.io.emit("clientConnection", this.gameObjects);

      socket.on("clientUpdate", ({ inputState: { keys } }) => {
        const player = this.players.find(player => player.id === socket.id);

        // update player's positiond
        if (keys.UP || keys.SPACE) {
          player.isBoosting = true;
        }
        if (!keys.UP && !keys.SPACE) {
          player.isBoosting = false;
        }
        if (keys.LEFT) {
          player.dir += 3 / (player.radius / Player.PLAYER_INITIAL_RADIUS);
        }
        if (keys.RIGHT) {
          player.dir -= 3 / (player.radius / Player.PLAYER_INITIAL_RADIUS);
        }
      });

      socket.on("disconnect", () => {
        // delete player
        this.players = this.players.filter(player => player.id !== socket.id);

        // delete connection
        delete this.connections[socket.id];

        // notify client
        this.io.emit("clientDisconnect", socket.id);
      });
    });
  }

  update() {
    this.gameObjects = [...this.players]; // later on add more object types
    this.timer.update();
    const dt = utils.toFixedPrecision(this.timer.getEllapsedTime() / 1000, 2);

    this.players.forEach(player => {
      player.update(dt);
    });

    // notify client about new game state
    const gameState = {
      players: this.players
    };
    this.io.emit("update", gameState);
  }

  gameLoop() {
    this.update();
    setTimeout(this.gameLoop.bind(this), 1000 / 60);
  }
}

module.exports.Game = Game;
