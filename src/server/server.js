const express = require("express");
const app = express();
const http = require("http").Server(app);
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const indexRoute = require("./routing/index.js");
const logger = require("morgan");
const createError = require("http-errors");

/**
 * HTTP SERVER
 */

// constants
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const PORT_NUMBER = process.env.PORT || 3000;

// database
const db = require("./db.js");

// middleware
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// view engine
app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "pug");

// session setup
const sess = session({
  secret: "my-secret",
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({
    url: MONGODB_URI
  })
});
app.use(sess);

// static files
app.use("/client", express.static(path.join(__dirname, "../client")));
app.use("/shared", express.static(path.join(__dirname, "../shared")));

// routing
app.use("/", indexRoute);

app.use((req, res, next) => {
  next(new createError.NotFound());
});

// error handling
app.use((err, req, res, next) => {
  if (err.status) {
    res.status(err.status);
  } else {
    res.status(500);
  }
  res.send({ message: err.message || "une erreur est survenue" });
});

db.connect(MONGODB_URI, err => {
  if (!err) {
    http.listen(PORT_NUMBER, () => {
      console.log("listening on *:%d", PORT_NUMBER);
      game.step();
    });
  } else {
    console.log("mongodb is not connected");
  }
});

/**
 * WEBSOCKET SERVER
 */
const io = require("socket.io")(http);
const sharedsession = require("express-socket.io-session");
const Game = require("./slither/game.server.js").Game;

const game = new Game(io);
const connections = {};

io.use(
  sharedsession(sess, {
    autoSave: true
  })
);

io.on("connection", socket => {
  console.log("new connection: ", socket.id);

  connections[socket.id] = socket;

  socket.on("client-join-game", viewport => {
    // Create new snake
    const snake = game.spawnSnake(socket.id);
    snake.viewport = viewport;

    // Inform the player about the current state of the game
    socket.emit("server-start-game", game.getFullGameStateAsJSON());

    // Finally let the player enter the game
    socket.join("game");
  });

  socket.on("client-input", ({ actions }) => {
    // Organize player input by socket ID.
    game.clientInput[socket.id] = [
      ...(game.clientInput[socket.id] || []),
      ...actions
    ];
  });

  socket.on("client-leave-game", () => {
    socket.leave("game");
    console.log(`player ${socket.id} has left the game`);
  });

  socket.on("disconnect", () => {
    delete connections[socket.id];
    game.removePlayer(socket.id);
    game.io.emit("server-disconnect", socket.id);
  });
});
