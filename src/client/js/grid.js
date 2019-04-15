function Grid(innerGridSize) {
  this.innerGridSize = innerGridSize || 100;
}

Grid.prototype.draw = function(ctx, camera) {
  var innerGridSize = this.innerGridSize;
  var minX = Math.floor(camera.left / innerGridSize, 2) * innerGridSize;
  var maxX = Math.ceil(camera.right / innerGridSize, 2) * innerGridSize;
  var minY = Math.floor(camera.top / innerGridSize, 2) * innerGridSize;
  var maxY = Math.ceil(camera.bottom / innerGridSize, 2) * innerGridSize;

  for (var i = minX; i <= maxX; i += innerGridSize) {
    if (i % (innerGridSize * 5) === 0) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    }
    ctx.beginPath();
    ctx.moveTo(camera.applyToX(i), camera.applyToY(camera.top));
    ctx.lineTo(camera.applyToX(i), camera.applyToY(camera.bottom));
    ctx.stroke();
  }
  for (var j = minY; j <= maxY; j += innerGridSize) {
    if (j % (innerGridSize * 5) === 0) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    }
    ctx.beginPath();
    ctx.moveTo(camera.applyToX(camera.left), camera.applyToY(j));
    ctx.lineTo(camera.applyToX(camera.right), camera.applyToY(j));
    ctx.stroke();
  }
};

export default Grid;
