import Game from "./game.client.js";
import { updateUserInfo } from "./ajax.js";

document.addEventListener("DOMContentLoaded", function() {
  window.animatedBackground.start();

  function resize() {
    const wWidth = Math.ceil(window.innerWidth);
    const wHeight = Math.ceil(window.innerHeight);
    const diagonal = Math.sqrt(wWidth * wWidth + wHeight * wHeight);
    const aspectRatio = wWidth / wHeight;
    let cWidth = Math.ceil((1800 * wWidth) / diagonal);
    let cHeight = Math.ceil((1800 * wHeight) / diagonal);

    if (cWidth > MAX_CANVAS_SIZE) {
      cWidth = MAX_CANVAS_SIZE;
      cHeight = MAX_CANVAS_SIZE / aspectRatio;
    }
    if (cHeight > MAX_CANVAS_SIZE) {
      cHeight = MAX_CANVAS_SIZE;
      cWidth = MAX_CANVAS_SIZE * aspectRatio;
    }

    const canvas = document.querySelector("#game-container canvas");
    // change resolution
    canvas.setAttribute("width", cWidth);
    canvas.setAttribute("height", cHeight);
  }

  window.addEventListener("resize", resize);
  resize();

  window.addEventListener("click", function(event) {
    const playButton = document.getElementById("playButton");

    if (event.target === playButton) {
      connect();
    }
  });

  let socket = null;

  /**
   * connect to websocket server
   */
  function connect() {
    if (socket !== null && socket.readyState === 1) return;

    socket = new WebSocket(`ws://${window.location.host}`, "protocolOne");
    // ws.binaryType = "arraybuffer"; /* IMPLEMENT LATER */

    socket.onopen = function(event) {
      console.log("connection established");
      let game;

      socket.onmessage = function(event) {
        const data = event.data;
        const type = decode(data[0]);
        const payload = data.length > 1 ? JSON.parse(data.substr(1)) : null;

        switch (type) {
          // Get socket id.
          case "s-socket-id": {
            socket.id = payload;
            break;
          }

          // All is good, we're allowed to start the game.
          case "s-authorized": {
            game = new Game(socket);
            game.requestJoin();
            break;
          }

          // Another connection is already open on the same session.
          case "s-unauthorized": {
            socket.close();

            // display warning message
            const unauthorizedEl = document.getElementById(
              "unauthorized-warning"
            );
            const userInfo = document.getElementById("user-info");
            const playButton = document.getElementById("playButton");

            userInfo.style.display = "none";
            playButton.style.display = "none";
            unauthorizedEl.style.display = "block";
            break;
          }

          case "s-all-snakes-skins": {
            const snakes = payload;

            snakes.forEach(({ id, name, hue }) => {
              game.createSnakeSkin(id, name, hue);
            });

            socket.send(encode("c-ready-to-go"));
            break;
          }

          // Information about the game world position and bounaries
          case "s-game-world": {
            game.world = payload;
            break;
          }

          // Start the game
          case "s-start-game": {
            window.animatedBackground.stop();

            const menuContainer = document.getElementById("menu-container");
            const gameContainer = document.getElementById("game-container");
            window.ontransitionend = () => {
              menuContainer.style.display = "none";
              window.ontransitionend = null;
            };
            menuContainer.classList.add("fade-out");

            gameContainer.style.display = "block";

            game.joinRequested = false;
            game.inGame = true;

            game.create();
            break;
          }

          // We lost.
          case "s-game-over": {
            const menuContainer = document.getElementById("menu-container");
            const transitionEndOrCancel = () => {
              const gameContainer = document.getElementById("game-container");
              gameContainer.style.dislay = "none";

              socket.close();
              game.stop();

              // prevent calling this event listener again
              window.ontransitionend = null;
              window.ontransitioncancel = null;

              game.transitionRunning = false;
              game.inGame = false;

              // defer joining game until after all transitions have finished.
              if (game.joinRequested) {
                game.join();
              }
            };

            window.ontransitioncancel = transitionEndOrCancel;
            window.ontransitionend = transitionEndOrCancel;

            updateUserInfo();

            // trigger transition
            menuContainer.style.display = "block";
            setTimeout(() => {
              menuContainer.classList.remove("fade-out");
              window.animatedBackground.start();
              game.transitionRunning = true;
            }, 10);
            break;
          }

          // Received new updated game state from the server.
          case "s-update": {
            const gameState = payload;
            game.processServerUpdate(gameState);
            game.getPlayer() && game.processClientInput();
            break;
          }
        }
      };

      socket.onerror = function(event) {
        console.log("an error has occurred: " + event);
      };
      socket.onclose = function(event) {
        console.log("connection closed");
      };
    };
  }
});
