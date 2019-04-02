export default class KeyboardManager {
  constructor() {
    this.mappings = {
      KeyQ: "A",
      KeyW: "Z",
      ArrowUp: "UP",
      ArrowLeft: "LEFT",
      ArrowRight: "RIGHT",
      ArrowDown: "DOWN",
      Enter: "ENTER",
      Space: "SPACE"
    };

    this.keys = {
      // contains state of all keys, ignores polling
    };

    document.addEventListener("keydown", this.handleKeydown.bind(this), false);
    document.addEventListener("keyup", this.handleKeyup.bind(this), false);
  }

  handleKeydown(e) {
    const keyName = this.mappings[e.code];
    this.keys[keyName] = true;
    if (e.code === "ArrowLeft") this.keys.ArrowRight = false;
    if (e.code === "ArrowRight") this.keys.ArrowLeft = false;
    if (e.code === "ArrowUp") this.keys.ArrowDown = false;
    if (e.code === "ArrowDown") this.keys.ArrowUp = false;
  }

  handleKeyup(e) {
    const keyName = this.mappings[e.code];
    this.keys[keyName] = false;
  }
}
