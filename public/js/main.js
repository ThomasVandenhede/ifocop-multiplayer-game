import Game from "./game.client.js";

document.addEventListener("DOMContentLoaded", function() {
  // Initialize socket.io
  const socket = io();
  // Button to enter the game
  const buttonStart = document.getElementById("start");

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

  buttonStart.addEventListener("click", function(event) {
    const loginEl = document.getElementById("login");
    loginEl.classList.add("fade-out");
    socket.emit("join game");
  });

  const game = new Game(socket);
});
