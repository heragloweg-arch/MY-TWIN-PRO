global.__DEV__ = true;

// Polyfill requestAnimationFrame for Node.js (Jest)
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};
