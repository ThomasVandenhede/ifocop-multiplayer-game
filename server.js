const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");
const Game = require("./slither/game.js").Game;

const game = new Game(io);

const PORT_NUMBER = process.env.PORT || 3000;

// webserver logic
app.use(express.static(path.join(__dirname, "/public")));

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

http.listen(PORT_NUMBER, function() {
  console.log("listening on *:%d", PORT_NUMBER);
  game.step();
});
