import AABB from "./aabb.js";
import { PI2 } from "./constants.js";

export default class Renderer {
  constructor(game) {
    this.game = game;

    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");

    this.pre = document.createElement("canvas");
    this.pre.width = this.canvas.width;
    this.pre.height = this.canvas.height;
    this.preCtx = this.pre.getContext("2d");
  }

  renderPellet(pellet, ctx, camera) {
    ctx.fillStyle = `hsl(${pellet.hue}, 100%, 69%)`;
    ctx.beginPath();
    ctx.arc(
      camera.applyToX(pellet.x),
      camera.applyToY(pellet.y),
      camera.applyToDistance(pellet.r),
      0,
      PI2
    );
    ctx.fill();
  }

  renderSnake(snake, ctx, camera) {
    // const segmentCount = snake.segments.length;
    const snakeImages = this.game.snakeImages[snake.id];
    const nameImg = snakeImages.name;
    const body = snakeImages.body;
    const spriteCount = body.width / body.height;

    // draw snake
    ctx.lineWidth = camera.applyToDistance(snake.radius * 2);

    for (let i = snake.segments.length - 2; i >= 0; i--) {
      const segment = snake.segments[i];
      ctx.drawImage(
        body,
        body.height * (i % spriteCount),
        0,
        body.height,
        body.height,
        camera.applyToX(segment.x - snake.radius),
        camera.applyToY(segment.y - snake.radius),
        camera.applyToDistance(snake.radius * 2),
        camera.applyToDistance(snake.radius * 2)
      );
      // if (snake.speed > snake.BASE_SPEED) {
      //   const t =
      //     (snake.speed - snake.BASE_SPEED) /
      //     (snake.MAX_SPEED - snake.BASE_SPEED);

      //   ctx.shadowBlur = camera.applyToDistance(50) * t;
      //   ctx.shadowColor = "red";
      //   ctx.fill();
      // }
    }
    // ctx.shadowBlur = 0; // default
    // ctx.shadowColor = "rgba(0, 0, 0, 0)"; // default

    // display player name
    ctx.drawImage(
      nameImg,
      camera.applyToX(snake.x) - nameImg.width / 2,
      camera.applyToY(snake.y + snake.radius) + 15
    );
  }

  cropBoundary(ctx, camera) {
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(
      camera.applyToX(this.game.world.x),
      camera.applyToY(this.game.world.y),
      camera.applyToDistance(this.game.world.r),
      0,
      PI2
    );
    ctx.fill();
    ctx.globalCompositeOperation = "source-over"; // default
  }

  renderBoundary(ctx, camera) {
    ctx.lineWidth = camera.applyToDistance(10);
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.arc(
      camera.applyToX(this.game.world.x),
      camera.applyToY(this.game.world.y),
      camera.applyToDistance(this.game.world.r),
      0,
      PI2
    );
    ctx.closePath();
    ctx.stroke();
  }

  clearCanvases() {
    this.preCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render() {
    this.clearCanvases();

    this.preCtx.lineWidth = 1; // default
    this.game.grid.draw(this.preCtx, this.game.camera);
    this.game.pellets.forEach(pellet => {
      var boundingRect = new AABB({
        x: pellet.x - pellet.r,
        y: pellet.y - pellet.r,
        width: pellet.r * 2,
        height: pellet.r * 2
      });
      if (boundingRect.overlaps(this.game.camera)) {
        this.renderPellet(pellet, this.preCtx, this.game.camera);
      }
    });
    this.game.snakes.forEach(snake =>
      this.renderSnake(snake, this.preCtx, this.game.camera)
    );
    this.cropBoundary(this.preCtx, this.game.camera);
    this.renderBoundary(this.preCtx, this.game.camera);

    // Render our off-screen canvas to the visible canvas.
    this.ctx.drawImage(this.pre, 0, 0);

    // // draw quadtree
    // const that = this;
    // that.ctx.strokeStyle = "yellow";
    // this.game.quadtree.visit(function() {
    //   window.drawQuadtree(this, false, that.ctx);
    // });
  }
}

// /* global window, document */

// window.randomNb = function(min, max) {
//   if (min >= max) throw new Error("min must be < max");
//   return Math.floor(Math.random() * (max - min)) + min;
// };

// window.randomColor = function() {
//   var color = (((1 << 24) * Math.random()) | 0).toString(16);
//   var pad = function(str, length) {
//     if (str.length < length) {
//       str = "0" + str;
//       return pad(str, length);
//     } else {
//       return str;
//     }
//   };
//   return "#" + pad(color, 6);
// };

// window.drawSquare = function(elt, fill, context) {
//   context.beginPath();
//   context.moveTo(elt.x, elt.y);
//   context.lineTo(elt.x + (elt.width ? elt.width : 1), elt.y);
//   context.lineTo(
//     elt.x + (elt.width ? elt.width : 1),
//     elt.y + (elt.height ? elt.height : 1)
//   );
//   context.lineTo(elt.x, elt.y + (elt.height ? elt.height : 1));
//   context.closePath();
//   context.stroke();
//   if (fill) context.fill();
// };

// window.drawQuadtree = function(tree, fill, context) {
//   var halfWidth = Math.max(Math.floor(tree.width / 2), 1);
//   var halfHeight = Math.max(Math.floor(tree.height / 2), 1);

//   window.drawSquare(
//     {
//       x: tree.x,
//       y: tree.y,
//       width: halfWidth,
//       height: halfHeight
//     },
//     fill,
//     context
//   );
//   window.drawSquare(
//     {
//       x: tree.x + halfWidth,
//       y: tree.y,
//       width: halfWidth,
//       height: halfHeight
//     },
//     fill,
//     context
//   );
//   window.drawSquare(
//     {
//       x: tree.x,
//       y: tree.y + halfHeight,
//       width: halfWidth,
//       height: halfHeight
//     },
//     fill,
//     context
//   );
//   window.drawSquare(
//     {
//       x: tree.x + halfWidth,
//       y: tree.y + halfHeight,
//       width: halfWidth,
//       height: halfHeight
//     },
//     fill,
//     context
//   );
// };

// window.makeMovable = function(element, boundaryElement, callbacks) {
//   var extractPos = function(event) {
//     return {
//       x: event.clientX ? event.clientX : event.changedTouches[0].clientX,
//       y: event.clientY ? event.clientY : event.changedTouches[0].clientY
//     };
//   };

//   var resizeAction = function(event) {
//     var targetRect = element.getBoundingClientRect();
//     var position = extractPos(event);

//     if (boundaryElement) {
//       var boundaries = boundaryElement.getBoundingClientRect();
//       element.style.height = Math.max(
//         5,
//         Math.min(
//           position.y - targetRect.top,
//           boundaries.bottom - targetRect.top
//         )
//       );
//       element.style.width = Math.max(
//         5,
//         Math.min(
//           position.x - targetRect.left,
//           boundaries.right - targetRect.left
//         )
//       );
//     } else {
//       element.style.height = Math.max(5, position.y - targetRect.top);
//       element.style.width = Math.max(5, position.x - targetRect.left);
//     }

//     if (
//       callbacks &&
//       callbacks.onResize &&
//       typeof callbacks.onResize === "function"
//     ) {
//       callbacks.onResize();
//     }
//   };
//   var lastMovePos = null;
//   var clickAction = function(event) {
//     var targetRect = element.getBoundingClientRect();
//     var position = extractPos(event);

//     if (
//       Math.abs(position.y - targetRect.bottom) < 12 &&
//       Math.abs(position.x - targetRect.right < 12)
//     ) {
//       document
//         .getElementsByTagName("body")[0]
//         .addEventListener("mousemove", resizeAction);
//       document
//         .getElementsByTagName("body")[0]
//         .addEventListener("touchmove", resizeAction);
//     } else {
//       document
//         .getElementsByTagName("body")[0]
//         .addEventListener("mousemove", moveAction);
//       document
//         .getElementsByTagName("body")[0]
//         .addEventListener("touchmove", moveAction);
//       lastMovePos = { x: position.x, y: position.y };
//     }
//     event.preventDefault();
//   };
//   var moveAction = function(event) {
//     var position = extractPos(event);

//     if (boundaryElement && boundaryElement.contains(event.target)) {
//       var boundaries = boundaryElement.getBoundingClientRect();

//       element.style.top =
//         parseInt(window.getComputedStyle(element).top) +
//         position.y -
//         lastMovePos.y;
//       element.style.left =
//         parseInt(window.getComputedStyle(element).left) +
//         position.x -
//         lastMovePos.x;
//       element.style.top = Math.max(
//         0,
//         Math.min(
//           parseInt(element.style.top),
//           boundaries.height - parseInt(window.getComputedStyle(element).height)
//         )
//       );
//       element.style.left = Math.max(
//         0,
//         Math.min(
//           parseInt(element.style.left),
//           boundaries.width - parseInt(window.getComputedStyle(element).width)
//         )
//       );

//       lastMovePos = { x: position.x, y: position.y };

//       if (
//         callbacks &&
//         callbacks.onMove &&
//         typeof callbacks.onMove === "function"
//       ) {
//         callbacks.onMove();
//       }
//     } else if (!boundaryElement) {
//       element.style.top =
//         parseInt(window.getComputedStyle(element).top) +
//         position.y -
//         lastMovePos.y;
//       element.style.left =
//         parseInt(window.getComputedStyle(element).left) +
//         position.x -
//         lastMovePos.x;

//       lastMovePos = { x: position.x, y: position.y };

//       if (
//         callbacks &&
//         callbacks.onMove &&
//         typeof callbacks.onMove === "function"
//       ) {
//         callbacks.onMove();
//       }
//     }
//   };

//   element.addEventListener("mousedown", clickAction);
//   element.addEventListener("touchstart", clickAction);

//   document
//     .getElementsByTagName("body")[0]
//     .addEventListener("mouseup", function() {
//       document
//         .getElementsByTagName("body")[0]
//         .removeEventListener("mousemove", resizeAction);
//       document
//         .getElementsByTagName("body")[0]
//         .removeEventListener("mousemove", moveAction);
//     });
//   document
//     .getElementsByTagName("body")[0]
//     .addEventListener("touchend", function() {
//       document
//         .getElementsByTagName("body")[0]
//         .removeEventListener("touchmove", resizeAction);
//       document
//         .getElementsByTagName("body")[0]
//         .removeEventListener("touchmove", moveAction);
//     });
// };
