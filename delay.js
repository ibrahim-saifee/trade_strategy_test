const delay = (ms) => {
  let start = Date.now();
  let now = start;
  while (now - start < ms) {
    now = Date.now();
  }
}

module.exports = { delay };
