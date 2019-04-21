const GameTimer = require("./gameTimer.js").GameTimer;
const Snake = require("./snake.js");
const utils = require("../../shared/utils.js");
const Circle = require("./geometry/circle.js");
const Pellet = require("./pellet.js");
const mongodb = require("mongodb");
const db = require("../db.js");

class Game {
  constructor(wss) {
    // Socket.io
    this.wss = wss;

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
    this.pellets = [];
    this.MAX_PELLET_COUNT = 200;
    for (let i = 0; i < this.MAX_PELLET_COUNT; i++) {
      this.spawnRandomPellet();
    }
  }

  spawnRandomPellet() {
    if (this.pellets.length >= this.MAX_PELLET_COUNT) return;

    let x, y, alpha, r;
    let hue = utils.randInt(0, 359);

    alpha = utils.randInt(0, 360);
    r = utils.randInt(0, this.world.r - 50);
    x = this.world.x + Math.round(Math.cos(utils.degToRad(alpha)) * r);
    y = this.world.y + Math.round(Math.sin(utils.degToRad(alpha)) * r);

    this.pellets.push(new Pellet({ game: this, x, y, size: "s", hue }));
  }

  spawnSnake(id, name) {
    const newSnake = new Snake({
      game: this,
      x: this.world.x,
      y: this.world.y,
      id,
      name
    });
    this.snakes.push(newSnake);
    this.wss.to("game").send(
      JSON.stringify({
        type: "s-new-snake",
        payload: {
          id: newSnake.id,
          name: newSnake.name,
          hue: newSnake.hue
        }
      })
    );
    return newSnake;
  }

  getSnakeById(id) {
    return this.snakes.find(snake => snake.id === id);
  }

  removePlayer(id) {
    this.snakes = this.snakes.filter(snake => snake.id !== id);
  }

  getGameState() {
    return {
      world: this.world,
      snakes: this.snakes,
      pellets: this.pellets
    };
  }

  getGameUpdate() {
    return {
      snakes: this.encodeSnakes(this.snakes),
      pellets: this.encodePellets(this.pellets)
    };
  }

  encodeSnakes(snakes) {
    return snakes
      .filter(snake => !snake.isDead)
      .map(snake => ({
        ...snake,
        segments: snake.segments.reduce(
          (acc, segment) => [...acc, segment.x, segment.y, segment.dir],
          []
        )
      }));
  }

  encodePellets(pellets) {
    return pellets.reduce(
      (acc, pellet) => [...acc, pellet.x, pellet.y, pellet.r, pellet.hue],
      []
    );
  }

  step() {
    this.update();
    setTimeout(this.step.bind(this), 1000 / 30);
  }

  update() {
    this.timer.update();
    const dt = utils.toFixedPrecision(this.timer.getEllapsedTime() / 1000, 2);

    this.handleClientInput();

    this.pellets.forEach(pellet => pellet.update(dt));
    this.snakes.forEach(snake => snake.update(dt));

    this.sendUpdate();
  }

  sendUpdate() {
    this.wss.to("game").send(
      JSON.stringify(
        {
          type: "s-update",
          payload: this.getGameUpdate()
        },
        (key, value) => {
          if (key === "game") {
            // omit game reference from within snakes
            return undefined;
          } else if (key === "snake") {
            // omit snake reference from within snake segments
            return undefined;
          } else {
            return value;
          }
        }
      )
    );
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
            player.target = player.dir +=
              (player.steering / 180) * Math.PI * frameDuration;
          }
          if (command === "LEFT") {
            player.target = player.dir -=
              (player.steering / 180) * Math.PI * frameDuration;
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
    const socket = this.wss.client(id);

    if (socket && socket.session) {
      const { userId } = socket.session;
      const dbClient = db.getInstance().db("slither");
      const usersCollection = dbClient.collection("users");
      const player = this.getSnakeById(socket.id);

      // update player's best score and max number of kills
      usersCollection
        .findOne({ _id: new mongodb.ObjectID(userId) })
        .then(user => {
          if (user) {
            const payload = {
              $set: {
                "stats.last_score": player.mass
              }
            };
            if (!user.stats.max_score || user.stats.max_score < player.mass) {
              payload.$set["stats.max_score"] = player.mass;
            }

            usersCollection.updateOne(
              {
                _id: new mongodb.ObjectID(userId)
              },
              payload
            );
          }
          console.log("Player score saved!");

          // remove player
          this.removePlayer(socket.id);

          socket.send(JSON.stringify({ type: "s-game-over" }));
        });
    }
  }

  emptyClientInput() {
    this.clientInput = {};
  }
}

module.exports.Game = Game;
