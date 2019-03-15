module.exports = {
  rgb() {
    const [r, g, b] = [...Array(3)].map(() => Math.floor(Math.random() * 256));
    return `rgb(${r}, ${g}, ${b})`;
  },
  hsl() {
    return `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`;
  }
};
