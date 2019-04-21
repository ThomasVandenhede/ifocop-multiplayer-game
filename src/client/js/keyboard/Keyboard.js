import Key from "./Key.js";
import keyCodes from "./keyCodes.js";

function Keyboard(game) {
  this.game = game;
  this.handleKeyup = this.handleKeyup.bind(this);
  this.handleKeydown = this.handleKeydown.bind(this);

  this.preventDefault = false;
  this.keys = keyCodes.reduce(function(keys, keyCode) {
    return Object.assign(keys, { [keyCode]: new Key(keyCode) });
  }, {});
  this.addEventListeners();
}

Keyboard.prototype.handleKeydown = function(event) {
  var key = this.keys[event.code];
  if (!key.isEnabled) return;

  if (this.preventDefault) {
    event.preventDefault ? event.preventDefault() : (event.returnValue = false);
  }

  key.event = event;
  key.isPressed = true;
  key.pressStart = event.timestamp;
  key.shiftKey = event.shiftKey;
  key.ctrlKey = event.ctrlKey;
  key.altKey = event.altKey;
  key.metaKey = event.metaKey;
  key.repeat = event.repeat;

  key.onDown.call(this.game);
};

Keyboard.prototype.handleKeyup = function(event) {
  var key = this.keys[event.code];
  if (!key.isEnabled) return;

  if (this.preventDefault) {
    event.preventDefault ? event.preventDefault() : (event.returnValue = false);
  }

  key.event = event;
  key.isPressed = false;
  key.pressEnd = event.timestamp;
  key.pressDuration = key.pressEnd - key.pressStart;
  key.shiftKey = event.shiftKey;
  key.ctrlKey = event.ctrlKey;
  key.altKey = event.altKey;
  key.metaKey = event.metaKey;
  key.repeat = event.repeat;

  key.onUp.call(this.game);
};

Keyboard.prototype.addEventListeners = function() {
  window.addEventListener("keydown", this.handleKeydown);
  window.addEventListener("keyup", this.handleKeyup);
};

Keyboard.prototype.removeEventListeners = function() {
  window.removeEventListener("keydown", this.handleKeydown);
  window.removeEventListener("keyup", this.handleKeyup);
};

Keyboard.prototype.disable = function() {
  this.preventDefault = false;
};

Keyboard.prototype.enable = function() {
  this.preventDefault = true;
};

export default Keyboard;
