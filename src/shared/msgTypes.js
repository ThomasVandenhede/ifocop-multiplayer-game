function swap(obj) {
  return Object.keys(obj).reduce((acc, key) => {
    acc[obj[key]] = key;
    return acc;
  }, {});
}

const startingCharCode = 97; // optional, corresponds to 'a'
const msgStrings = [
  "s-socket-id",
  "s-start-game",
  "s-unauthorized",
  "s-authorized",
  "s-new-snake",
  "s-game-world",
  "s-update",
  "s-game-over",
  "c-join-game",
  "c-input"
];
const msgTypes = msgStrings.reduce((acc, type, index) => {
  acc[type] = String.fromCharCode(startingCharCode + index);
  return acc;
}, {});
const msgTypeLookup = swap(msgTypes);

function encode(type) {
  return msgTypes[type];
}
function decode(charCode) {
  return msgTypeLookup[charCode];
}

if (typeof module === "object") {
  module.exports = {
    encode,
    decode
  };
} else {
  window.encode = encode;
  window.decode = decode;
}
