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

      socket.on("inputState", ({ keys }) => {
        const player = this.players.find(player => player.id === socket.id);
        // update player's positiond
        if (keys.UP || keys.SPACE) {
          player.speed = 400;
        }
        if (!keys.UP && !keys.SPACE) {
          player.speed = 180;
        }
        // if (keys.DOWN) {
        //   player.positions[0].y = player.positions[0].y + 7;
        // }
        if (keys.LEFT) {
          player.direction -=
            Math.PI / 64 / (player.radius / Player.PLAYER_INITIAL_RADIUS);
        }
        if (keys.RIGHT) {
          player.direction +=
            Math.PI / 64 / (player.radius / Player.PLAYER_INITIAL_RADIUS);
        }
        if (keys.A) {
          player.radius = Math.min(player.radius + 2, 200);
        }
        if (keys.Z) {
          player.radius = Math.max(10, player.radius - 2);
        }

        // notify client about new game state
        const gameState = {
          players: this.players
        };

        this.io.emit("update", gameState);
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
  }

  gameLoop() {
    this.update();
    setTimeout(this.gameLoop.bind(this), 1000 / 60);
  }
}

module.exports.Game = Game;
