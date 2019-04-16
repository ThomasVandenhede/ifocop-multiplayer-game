const router = require("express").Router();
const mongodb = require("mongodb");
const bcrypt = require("bcrypt");
const createError = require("http-errors");

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
      if (!user) throw createError(403, "invalid username");

      return bcrypt.compare(password, user.password).then(isMatch => {
        if (!isMatch) throw createError(403, "invalid password");

        req.session.userID = user._id;
        res.send();
      });
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
      // user already exists
      if (user) throw createError(403, "user already exists");

      return bcrypt.hash(plainPassword, saltRounds);
    })
    .then(hash =>
      usersCollection.insertOne({
        username,
        password: hash,
        max_score: 0,
        max_kills: 0
      })
    )
    .then(result => {
      req.session.userID = result.insertedId;
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
