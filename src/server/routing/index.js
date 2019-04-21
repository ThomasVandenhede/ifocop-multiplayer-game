const router = require("express").Router();
const mongodb = require("mongodb");
const bcrypt = require("bcrypt");
const createError = require("http-errors");

const db = require("../db.js");
const saltRounds = 10;

router.get("/", (req, res, next) => {
  if (req.session.userId) {
    const dbClient = db.getInstance().db("slither");
    const usersCollection = dbClient.collection("users");

    usersCollection
      .findOne({ _id: new mongodb.ObjectID(req.session.userId) })
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

        req.session.userId = user._id;
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
        stats: {
          max_score: 0,
          max_kills: 0,
          last_score: 0,
          last_game_duration: 0
        }
      })
    )
    .then(result => {
      req.session.userId = result.insertedId;
      res.status(200);
      res.send();
    })
    .catch(next);
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.send();
});

router.get("/me", (req, res, next) => {
  const id = req.session.userId;

  if (!id) next(new createError.Forbidden());

  db.getInstance()
    .db("slither")
    .collection("users")
    .findOne(
      {
        _id: new mongodb.ObjectID(id)
      },
      { projection: { password: false } }
    )
    .then(user => {
      if (!user) throw new createError.NotFound();

      res.json(user);
    })
    .catch(next);
});

module.exports = router;
