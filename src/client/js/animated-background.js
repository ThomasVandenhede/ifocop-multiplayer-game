// canvas background
function createAnimatedBackground() {
  const menuContainer = document.getElementById("menu-container");
  const canvas = document.createElement("canvas");
  canvas.id = "bg";
  canvas.style.position = "absolute";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.zIndex = -1;

  const ctx = canvas.getContext("2d");

  function resize() {
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    // change resolution
    canvas.setAttribute("width", canvasWidth);
    canvas.setAttribute("height", canvasHeight);
  }

  resize();

  const randInt = (start, end) => {
    return Math.floor(Math.random() * (end - start + 1) + start);
  };

  const hsl = () => {
    return `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`;
  };

  const ballCount = 40;
  const balls = [];
  for (let i = 0; i < ballCount; i++) {
    const x = randInt(0, canvas.width);
    const y = randInt(0, canvas.height);
    const vx = randInt(10, 80) * (randInt(0, 1) * 2 - 1);
    const vy = randInt(10, 80) * (randInt(0, 1) * 2 - 1);
    const r = randInt(10, 20);
    const color = hsl();
    balls.push({ x, y, vx, vy, r, color });
  }

  let then;
  let now = Date.now();
  let frame;

  function step() {
    frame = requestAnimationFrame(step);
    then = now;
    now = Date.now();
    const dt = (now - then) / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i];
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.x > canvas.width + ball.r) {
        ball.x = -ball.r;
      } else if (ball.x < -ball.r) {
        ball.x = canvas.width + ball.r;
      }
      if (ball.y > canvas.height + ball.r) {
        ball.y = -ball.r;
      } else if (ball.y < -ball.r) {
        ball.x = canvas.width + ball.r;
      }

      ctx.fillStyle = ball.color;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  return {
    start() {
      menuContainer.appendChild(canvas);
      window.addEventListener("resize", resize);
      resize();
      step();
    },
    stop() {
      cancelAnimationFrame(frame);
      canvas.parentNode && canvas.parentNode.removeChild(canvas);
      window.removeEventListener("resize", resize);
    }
  };
}

window.animatedBackground = createAnimatedBackground();
