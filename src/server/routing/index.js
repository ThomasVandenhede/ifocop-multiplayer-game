const router = require("express").Router();
const mongodb = require("mongodb");
const bcrypt = require("bcrypt");

const db = require("../db.js");
const saltRounds = 10;

router.get("/", (req, res, next) => {
  if (req.session.userID) {
    const dbClient = db.getInstance().db("slither");
    const usersCollection = dbClient.collection("users");

    usersCollection
      .findOne({ _id: new mongodb.ObjectID(req.session.userID) })
      .then(user => {
        res.render("index", { user });
      })
      .catch(next);
  } else {
    res.render("index");
  }
});

router.post("/login", (req, res, next) => {
  const { username, password } = req.body;
  const dbClient = db.getInstance().db("slither");
  const usersCollection = dbClient.collection("users");

  usersCollection
    .findOne({
      username
    })
    .then(user => {
      if (user && user.username === username) {
        bcrypt.compare(password, user.password, function(err, isMatch) {
          if (err) next(err);

          if (isMatch) {
            // save userID in session
            req.session.userID = user._id;

            res.status(200);
            res.send();
          } else {
            res.status(401);
            next(new Error("mot de passe invalide"));
          }
        });
      } else {
        res.status(401);
        next(new Error("invalid username"));
      }
    })
    .catch(next);
});

router.post("/signup", (req, res, next) => {
  const { username, password: plainPassword } = req.body;
  const dbClient = db.getInstance().db("slither");
  const usersCollection = dbClient.collection("users");

  usersCollection
    .findOne({
      username
    })
    .then(user => {
      if (user) {
        res.status(401);
        next(new Error("username or email already taken"));
      }

      // No user found with same username or email, we may create account.
      bcrypt.hash(plainPassword, saltRounds, function(hashErr, hash) {
        if (hashErr) next(hashErr);

        return usersCollection.insertOne({
          username,
          password: hash,
          max_score: 0,
          max_kills: 0
        });
      });
    })
    .then(user => {
      req.session.userID = user._id;
      res.status(200);
      res.send();
    })
    .catch(next);
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.send();
});

module.exports = router;
