const createNetEmitter = (function() {
  const msgType = {
    "game start": String.fromCharCode(0),
    "update state": String.fromCharCode(1),
    "private message": String.fromCharCode(2)
  };
  const msgTypeLookup = ["game start", "update state", "private message"];

  function createNetEmitter(EventEmitter, socket) {
    const receiver = new EventEmitter({ wildcard: true });

    socket.on("message", function(encodedString) {
      const event = msgTypeLookup[encodedString.charCodeAt(0)];
      receiver.emit(event, encodedString.substr(1));
    });

    const sender = new EventEmitter({ wildcard: true });

    sender.on("*", function(encodedString) {
      socket.send(msgType[this.event] + encodedString);
    });

    return { receiver, sender };
  }

  return createNetEmitter;
})();

if (typeof module === "object") {
  /**
   * If netEmitter is loaded as a Node module, then this line is called.
   */
  module.exports = { createNetEmitter };
} else {
  /**
   * If netEmitter is loaded into the browser, then this line is called.
   */
  window.netEmitter = { createNetEmitter };
}
