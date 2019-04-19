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
const mongodb = require("mongodb");
const db = require("./db.js");

/**
 * HTTP SERVER
 */

// constants
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const PORT_NUMBER = process.env.PORT || 3000;

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

function checkSessionAlreadyOpen(socket) {
  return !!Object.keys(connections).find(key => {
    const conn = connections[key];

    // filter out the socket passed as argument
    if (conn.id !== socket.id) {
      // we check if another ws connection is attached to the same session
      if (
        conn.handshake.session &&
        socket.handshake.session &&
        conn.handshake.session.userID === socket.handshake.session.userID
      ) {
        return true;
      }
      return false;
    }
  });
}

io.on("connection", socket => {
  console.log("new connection: ", socket.id);
  connections[socket.id] = socket;

  // If another connection is already open on the same session inform the client and it and tell them they can't join the game.
  const alreadyOpen = checkSessionAlreadyOpen(socket);

  if (alreadyOpen) {
    socket.emit("server-unauthorized");
    delete connections[socket.id];
    socket.disconnect();
    return;
  }

  /**
   * Clients wants to enter.
   */
  socket.on("client-join-game", viewport => {
    if (socket.handshake.session.userID) {
      db.getInstance()
        .db("slither")
        .collection("users")
        .findOne({
          _id: new mongodb.ObjectID(socket.handshake.session.userID)
        })
        .then(user => {
          // Create new snake
          const snake = game.spawnSnake(socket.id, user.username);
          snake.viewport = viewport;

          // Inform the player about the current state of the game
          socket.emit("server-start-game", game.getFullGameStateAsJSON());

          // Finally let the player enter the game
          socket.join("game");
        });
    }
  });

  /**
   * Handle input messages from client.
   */
  socket.on("client-input", ({ actions }) => {
    game.clientInput[socket.id] = [
      ...(game.clientInput[socket.id] || []),
      ...actions
    ];
  });

  /**
   * Client is ready to leave the game.
   */
  socket.on("client-leave-game", () => {
    socket.leave("game");
    console.log(`player ${socket.id} has left the game`);
  });

  /**
   * Automatically emitted when client disconnects.
   */
  socket.on("disconnect", () => {
    console.log("disconnection: " + socket.id);
    delete connections[socket.id];
    game.removePlayer(socket.id);
    game.io.emit("server-disconnect", socket.id);
  });
});
