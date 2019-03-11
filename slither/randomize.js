module.exports = function() {
  const [r, g, b] = [...Array(3)].map(() => Math.floor(Math.random() * 256));
  return `rgb(${r}, ${g}, ${b})`;
};
