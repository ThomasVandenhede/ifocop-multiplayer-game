import Game from "./game.client.js";

document.addEventListener("DOMContentLoaded", function() {
  window.animatedBackground.start();

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

  window.addEventListener("click", function(event) {
    const playButton = document.getElementById("playButton");

    if (event.target === playButton) {
      window.animatedBackground.stop();
      game.requestJoin();
    }
  });

  const game = new Game(socket);
});
