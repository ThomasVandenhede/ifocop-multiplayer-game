const express = require("express");
const app = express();
const server = require("http").Server(app);
const path = require("path");
const bodyParser = require("body-parser");
const sessionParser = require("express-session");
const MongoStore = require("connect-mongo")(sessionParser);
const indexRoute = require("./routing/index.js");
const createError = require("http-errors");
const db = require("./db.js");
const mongodb = require("mongodb");
const { encode, decode } = require("../shared/msgTypes.js");

/**
 * HTTP SERVER
 */

// constants
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const PORT_NUMBER = process.env.PORT || 3000;

// middleware
// app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// view engine
app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "pug");

// session setup
const session = sessionParser({
  secret: "my-secret",
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({
    url: MONGODB_URI
  })
});
app.use(session);

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
    server.listen(PORT_NUMBER, () => {
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
const uuid = require("uuid");
const WebSocket = require("ws");
const wss = new WebSocket.Server({
  verifyClient: (info, done) => {
    console.log("Parsing session from request...");
    session(info.req, {}, () => {
      console.log("Session is parsed!");
      done(info.req.session.userId);
    });
  },
  server
});
const Game = require("./slither/game.server.js").Game;
const game = new Game(wss);
const clients = {
  // room system
  // by default, all clients are in the default room
  default: {}
};

/**
 * Send to all connected clients.
 * @param {*} data
 */
wss.send = function(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

/**
 * Find socket by id.
 * @param {*} id
 */
wss.client = function(id) {
  return clients.default[id];
};

/**clients
 * Send to all clients within a room.
 */
wss.to = function(roomName) {
  const room = clients[roomName] || {};
  const roomClients = new Set(Object.values(room));

  return {
    // array containing all clients within the room
    send: data => {
      roomClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    },
    client: id => {
      roomClients.find(client => client.id === id);
    }
  };
};

wss.attachMethods = function(ws) {
  /**
   * Send message to all open connexions except the current one.
   */
  ws.broadcast = function(data) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.id !== ws.id) {
        client.send(data);
      }
    });
  };

  /**
   * Join a room.
   */
  ws.join = function(roomName) {
    if (!roomName) return;

    if (!clients[roomName]) {
      clients[roomName] = {};
    }
    clients[roomName][ws.id] = ws;
  };

  /**
   * Leave a room.
   */
  ws.leave = function(roomName) {
    if (!roomName || !clients[roomName] || !clients[roomName][ws.id]) return;

    // leave room
    delete clients[roomName][ws.id];

    // if room is empty, delete the room
    if (!Object.keys(clients[roomName]).length) delete clients[roomName];
  };
  return ws;
};

/**
 * Check if another connection is already open on the same session.
 * @param {object} ws
 */
function sessionAlreadyOpen(ws) {
  return !!Object.keys(clients.default).find(key => {
    const client = clients.default[key];

    // filter out the ws passed as argument
    if (client.id !== ws.id) {
      // we check if another ws connection is attached to the same session
      if (
        client.session &&
        ws.session &&
        client.session.userId === ws.session.userId
      ) {
        return true;
      }
      return false;
    }
  });
}

wss.on("connection", function(ws, req) {
  // Attach the active session to the current ws object.
  ws.session = req.session;

  // Attach a unique id to the current ws object
  ws.id = uuid.v4();
  clients.default[ws.id] = ws;
  ws.send(encode("s-socket-id") + JSON.stringify(ws.id));

  // Add additional methods to the current ws object
  wss.attachMethods(ws);

  console.log(`New connection ${ws.id}`);

  if (sessionAlreadyOpen(ws)) {
    ws.send(encode("s-unauthorized"));
  } else {
    ws.send(encode("s-authorized"));
  }

  ws.on("message", function(data) {
    const type = decode(data[0]);
    const payload = data.length > 1 && JSON.parse(data.substr(1));

    switch (type) {
      case "c-join-game": {
        if (!req.session.userId) return;

        viewport = payload;
        db.getInstance()
          .db("slither")
          .collection("users")
          .findOne({
            _id: new mongodb.ObjectID(req.session.userId)
          })
          .then(user => {
            // join game!
            ws.join("game");

            // Create new snake
            const snake = game.spawnSnake(ws.id, user.username);
            snake.viewport = viewport;

            // Inform the player about the current state of the game
            ws.send(encode("s-game-world") + JSON.stringify(game.world));
            ws.send(encode("s-start-game"));
          })
          .catch(err => {
            console.log("TCL: err", err);
          });
        break;
      }

      case "c-input": {
        const { actions } = payload;
        game.clientInput[ws.id] = [
          ...(game.clientInput[ws.id] || []),
          ...actions
        ];
        break;
      }
    }
  });

  ws.on("error", function(error) {
    console.log("TCL: error", error);
  });

  ws.on("close", function(event) {
    console.log(`Closed connection ${ws.id}`);
    delete clients.default[ws.id];
    game.removePlayer(ws.id);
    ws.leave("game");
  });
});
