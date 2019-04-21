function Mouse({ element, callbackContext }) {
  // element
  this.element = element;
  this.callbackContext = callbackContext;

  // mouse config
  this.naturalScrolling = true;

  // mouse state
  this.buttons = {
    0: false,
    1: false,
    2: false
  };
  this.wheel = 0;
  this.clickX = 0;
  this.clickY = 0;
  this.releaseX = 0;
  this.releaseY = 0;
  this.x;
  this.y;
  this.dx = 0;
  this.dy = 0;

  this.mouseDownCallback = null;
  this.mouseUpCallback = null;
  this.mouseMoveCallback = null;
  this.contextMenuCallback = null;
  this.mouseOverCallback = null;
  this.mouseOutCallback = null;

  this.handleContextMenu = this.handleContextMenu.bind(this);
  this.handleMouseDown = this.handleMouseDown.bind(this);
  this.handleMouseUp = this.handleMouseUp.bind(this);
  this.handleMouseMove = this.handleMouseMove.bind(this);
  this.handleWheel = this.handleWheel.bind(this);

  this.addEventListeners();
}

Mouse.prototype.handleContextMenu = function(event) {
  event.preventDefault ? event.preventDefault() : (event.returnValue = false);
  if (typeof this.contextMenuCallback === "function") {
    this.contextMenuCallback.call(this.callbackContext, event);
  }
};

Mouse.prototype.handleMouseUp = function(event) {
  this.releaseX = event.clientX + this.element.offsetLeft;
  this.releaseY = event.clientY + this.element.offsetTop;
  this.buttons[event.button] = false;

  typeof this.mouseUpCallback === "function" &&
    this.mouseUpCallback.call(this.callbackContext, event);
};

Mouse.prototype.handleMouseDown = function(event) {
  this.clickX = event.clientX + this.element.offsetLeft;
  this.clickY = event.clientY + this.element.offsetTop;

  this.buttons[event.button] = true;

  typeof this.mouseDownCallback === "function" &&
    this.mouseDownCallback.call(this.callbackContext, event);
};

Mouse.prototype.handleMouseMove = function(event) {
  var scrollDirection = this.naturalScrolling ? 1 : -1;
  this.x = event.clientX + this.element.offsetLeft;
  this.y = event.clientY + this.element.offsetTop;

  typeof this.mouseMoveCallback === "function" &&
    this.mouseMoveCallback.call(this.callbackContext, event);
};

Mouse.prototype.handleWheel = function(event) {
  var deltaY = event.deltaY;

  typeof this.mouseWheelCallback === "function" &&
    this.mouseWheelCallback.call(this.callbackContext, event);
};

Mouse.prototype.addEventListeners = function() {
  window.addEventListener("contextmenu", this.handleContextMenu);
  window.addEventListener("mousedown", this.handleMouseDown);
  window.addEventListener("mouseup", this.handleMouseUp);
  window.addEventListener("mousemove", this.handleMouseMove);
  window.addEventListener("wheel", this.handleWheel);
};

Mouse.prototype.removeEventListeners = function() {
  window.removeEventListener("contextmenu", this.handleContextMenu);
  window.removeEventListener("mousedown", this.handleMouseDown);
  window.removeEventListener("mouseup", this.handleMouseUp);
  window.removeEventListener("mousemove", this.handleMouseMove);
  window.removeEventListener("wheel", this.handleWheel);
};

Mouse.prototype.on = function(el, type, callback) {
  // console.log("ON", el, type, callback);
  el.addEventListener(type, callback, arguments[3]);
};

Mouse.prototype.off = function(el, type, callback) {
  // console.log("OFF", el, type, callback);
  el.removeEventListener(type, callback, arguments[3]);
};

export default Mouse;
