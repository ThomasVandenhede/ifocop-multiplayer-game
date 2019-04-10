function Mouse({ element, callbackContext }) {
  // element
  this.element = element;
  var callbackContext = callbackContext;

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

  window.addEventListener("contextmenu", function(event) {
    event.preventDefault ? event.preventDefault() : (event.returnValue = false);
    this.contextMenuCallback.call(callbackContext, event);
  });

  window.addEventListener(
    "mousedown",
    function(event) {
      this.clickX = event.clientX + this.element.offsetLeft;
      this.clickY = event.clientY + this.element.offsetTop;

      this.buttons[event.button] = true;

      this.mouseDownCallback &&
        this.mouseDownCallback.call(callbackContext, event);
    }.bind(this)
  );

  window.addEventListener(
    "mouseup",
    function(event) {
      this.releaseX = event.clientX + this.element.offsetLeft;
      this.releaseY = event.clientY + this.element.offsetTop;
      this.buttons[event.button] = false;

      this.mouseUpCallback && this.mouseUpCallback.call(callbackContext, event);
    }.bind(this)
  );

  window.addEventListener(
    "mousemove",
    function(event) {
      var scrollDirection = this.naturalScrolling ? 1 : -1;
      this.x = event.clientX + this.element.offsetLeft;
      this.y = event.clientY + this.element.offsetTop;

      this.mouseMoveCallback &&
        this.mouseMoveCallback.call(callbackContext, event);
    }.bind(this)
  );

  window.addEventListener(
    "wheel",
    function(event) {
      var deltaY = event.deltaY;
    }.bind(this)
  );
}

Mouse.prototype.on = function(el, type, callback) {
  // console.log("ON", el, type, callback);
  el.addEventListener(type, callback, arguments[3]);
};

Mouse.prototype.off = function(el, type, callback) {
  // console.log("OFF", el, type, callback);
  el.removeEventListener(type, callback, arguments[3]);
};

export default Mouse;
