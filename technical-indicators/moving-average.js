const { MOVING_AVERAGE } = require("../config");

const candlesData = [];

const candleDataPush = (data, maxLength) => {
  candlesData.push(data);

  if (candlesData.length > maxLength) {
    candlesData.shift();
  }

  return candlesData;
};

const movingAverage = (data, maxLength = MOVING_AVERAGE) => {
  candleDataPush(data, maxLength);
  const sum = candlesData.reduce((sum, data) => sum + data.close, 0);

  return sum / candlesData.length;
};

const resetMovingAverage = () => {
  candlesData.length = 0;
}

module.exports = {
  movingAverage,
  resetMovingAverage,
};
