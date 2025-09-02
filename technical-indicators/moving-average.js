const { SMA_PERIOD } = require("../config");

const prices = [];

const periodicPush = (price, maxLength) => {
  prices.push(price);

  if (prices.length > maxLength) {
    prices.shift();
  }

  return prices;
};

const movingAverage = (price, maxLength = SMA_PERIOD) => {
  periodicPush(price, maxLength);
  const sum = prices.reduce((sum, p) => sum + p, 0);

  return sum / prices.length;
};

const resetMovingAverage = () => {
  prices.length = 0;
}

module.exports = {
  movingAverage,
  resetMovingAverage,
};
