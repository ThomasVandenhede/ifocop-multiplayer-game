const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");
const Game = require("./slither/game.server.js").Game;
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const mongodb = require("mongodb");

const mongoDB = process.env.MONGODB_URI || "mongodb://localhost:27017";

// constants
const PORT_NUMBER = process.env.PORT || 3000;

// database
const db = require("./db.js");

// middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// view engine
app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "pug");

const game = new Game(io);

// session setup
const sess = session({
  secret: "my-secret",
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({
    url: mongoDB
  })
});
const sharedsession = require("express-socket.io-session");

app.use(sess);

io.use(
  sharedsession(sess, {
    autoSave: true
  })
);

// static files
app.use(express.static(path.join(__dirname, "/public")));

// routing
app.get("/", (req, res) => {
  if (req.session.userID) {
    const dbClient = db.getInstance().db("slither");
    const usersCollection = dbClient.collection("users");

    usersCollection
      .findOne({ _id: new mongodb.ObjectID(req.session.userID) })
      .then(user => {
        res.render("index", { user });
      })
      .catch(error => {
        return next(new Error(error));
      });
  } else {
    res.render("index");
  }
});

app.post("/login", (req, res, next) => {
  const { username, password } = req.body;
  const dbClient = db.getInstance().db("slither");
  const usersCollection = dbClient.collection("users");

  usersCollection
    .findOne({
      username
    })
    .then(user => {
      if (user && user.username === username) {
        if (user.password === password) {
          // save userId in session
          req.session.userID = user._id;

          console.log("connexion success");
          res.status(200);
          res.send();
        } else {
          res.status(401);
          return next(new Error("invalid password"));
        }
        // bcrypt.compare(password, user.password, function(err, isMatch) {
        //   if (isMatch) {
        //     // save userID in session
        //     req.session.userID = user._id;

        //     // send
        //     res.status(200);
        //     res.send();
        //   } else {
        //     res.status(401);
        //     throw new Error("mot de passe invalide");
        //   }
        // });
      } else {
        res.status(401);
        return next(new Error("invalid username"));
      }
    })
    .catch(error => {
      return next(new Error(error));
    });
});

app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  const dbClient = db.getInstance().db("slither");
  const usersCollection = dbClient.collection("users");

  usersCollection
    .findOne({
      username
    })
    .then(user => {
      if (user) {
        return next(new Error("username or email already taken"));
      }

      // No user found with same username or email, we may create account.
      usersCollection
        .insertOne({
          username,
          password,
          maxScore: 0,
          maxKills: 0
        })
        .then(user => {
          req.session.userID = user._id;
          res.status(200);
          res.send();
        })
        .catch(error => {
          return next(new Error(error));
        });
    });
});

app.get("/logout", (req, res) => {
  console.log("destroy session");
  req.session.destroy();
  res.render("/");
});

// error handling
app.use(function(err, req, res, next) {
  res.send({ message: err.message || "une erreur est survenue" });
});

db.connect(mongoDB, function(err) {
  if (!err) {
    http.listen(PORT_NUMBER, function() {
      console.log("listening on *:%d", PORT_NUMBER);
      game.step();
    });
  } else {
    console.log("mongodb is not connected");
  }
});
