class GameTimer {
  constructor() {
    this.isPaused = false;
    this.isCountDown = true;
  }

  getEllapsedTime() {
    return this.currentTime - this.previousTime;
  }

  pause() {
    this.isPaused = true;
  }

  play() {
    this.isPaused = false;
    this.currentTime = Date.now();
  }

  update() {
    if (!this.isPaused) {
      this.previousTime = this.currentTime;
      this.currentTime = Date.now();
      this.totalTime += this.currentTime - this.previousTime;
    }
  }

  reset() {
    this.totalTime = 0;
    this.currentTime = Date.now();
    this.previousTime = this.currentTime;
    this.countdownStart = timestamp || 0.5 * 60 * 1000; // ms;
  }
}

module.exports.GameTimer = GameTimer;
