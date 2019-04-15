function Key(keyCode) {
  // Corresponds to event.code
  this.keyCode = keyCode;

  // Reference to last event fired targeting this key
  this.event;

  // key location (0: general keys, 1: left, 2: right)
  this.location;

  // key character; will be overridden
  this.key;

  // Boolean that represents whether the key has repeated
  this.repeat = false;

  // Modifiers
  this.altKey = false;
  this.shiftKey = false;
  this.metaKey = false;

  // Boolean that is true if this key is down
  this.isPressed = false;

  // timestamp when the key was pressed
  this.pressStart;

  // timestamp when the key was released
  this.pressEnd;

  // duration of the last press
  this.pressDuration;

  // Whether this key receives events
  this.isEnabled = true;

  // callback that is called when key is pressed
  this.onDown = function() {};

  // callback that is called when key is released
  this.onUp = function() {};
}

export default Key;
