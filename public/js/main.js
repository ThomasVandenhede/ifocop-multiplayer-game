import Game from "./game.js";

document.addEventListener("DOMContentLoaded", function() {
  // Initialize socket.io
  const socket = io();

  function fitCanvasToContainer() {
    var canvasWidth = parseFloat(getComputedStyle(canvas).width);
    var canvasHeight = parseFloat(getComputedStyle(canvas).height);
    // change resolution
    canvas.setAttribute("width", canvasWidth);
    canvas.setAttribute("height", canvasHeight);
  }

  const canvas = document.getElementById("canvas");

  window.addEventListener("resize", fitCanvasToContainer);
  fitCanvasToContainer();

  const game = new Game(socket);
  game.start();
});
