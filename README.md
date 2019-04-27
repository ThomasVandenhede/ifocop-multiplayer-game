# ifocop-multiplayer-game
This project is heavily inspired by the game [slither.io](slither.io).

It is based on [Express](http://expressjs.com), the [ws](https://github.com/websockets/ws) websocket module and [MongoDB](https://www.mongodb.com/).

The game uses **express-session** for authentication and each player's score and profile are saved to a **MongoDB** database hosted on Mongo Atlas.

![alt text](https://github.com/ThomasVandenhede/ifocop-multiplayer-game/blob/master/src/client/images/screenshot.png "game preview")

## Installation
To launch the game, follow the instructions.

1. Copy the repo:

```
$ git clone git@github.com:ThomasVandenhede/ifocop-multiplayer-game.git
```

2. Go inside the game folder and install the dependencies:

```
$ cd ifocop-multiplayer-game && npm install
```

3. Run the game:

```
$ nodemon run devstart
```
