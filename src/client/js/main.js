import Game from "./game.client.js";
import { PI2 } from "./constants.js";
import { updateUserInfo } from "./ajax.js";

document.addEventListener("DOMContentLoaded", function() {
  window.animatedBackground.start();

  function resize() {
    const canvases = Array.from(
      document.querySelectorAll("#game-container canvas")
    );
    canvases.forEach(canvas => {
      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight;
      // change resolution
      canvas.setAttribute("width", canvasWidth);
      canvas.setAttribute("height", canvasHeight);
    });
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
    console.log("TCL: connect -> socket", socket);
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

          // Our snake was created in the game.
          case "s-new-snake": {
            const { id, name, hue } = payload;

            // create name text canvas
            const nameCanvas = document.createElement("canvas");
            const nctx = nameCanvas.getContext("2d");
            const font = "18px arial";

            nctx.font = font;
            nameCanvas.width = nctx.measureText(name).width;
            nameCanvas.height = 25;

            nctx.fillStyle = "white";
            nctx.textBaseline = "top";
            nctx.font = font;
            nctx.fillText(name, 0, 0);

            // create snake spritesheet canvas
            const bodyCanvas = document.createElement("canvas");
            const bctx = bodyCanvas.getContext("2d");
            const r = 32;
            const count = 40;

            bodyCanvas.height = 2 * r;
            bodyCanvas.width = 2 * r * count;
            for (let i = 0; i < count; i++) {
              const x = r + i * 2 * r;
              const y = r;
              const t = Math.cos((PI2 * i * 2) / count);
              const l = utils.lerp(60, 69, t);
              const gradient = bctx.createRadialGradient(x, y, 0, x, y, r);
              gradient.addColorStop(0, `hsl(${hue}, 100%, 40%)`);
              gradient.addColorStop(1, `hsl(${hue}, 100%, ${l}%)`);
              bctx.fillStyle = gradient;

              bctx.beginPath();
              bctx.arc(x, y, r, 0, PI2);
              bctx.fill();
            }

            // save images
            game.snakeImages[id] = {
              color: `hsl(${hue}, 100%, 69%)`,
              name: nameCanvas,
              body: bodyCanvas
            };
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
