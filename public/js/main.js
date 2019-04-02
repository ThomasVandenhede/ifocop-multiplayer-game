import Game from "./game.js";

document.addEventListener("DOMContentLoaded", function() {
  // Initialize socket.io
  const socket = io();

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

  const game = new Game(socket);
});
