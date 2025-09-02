const fs = require("fs");
const csv = require("csv-parser");
const moment = require("moment");
const { movingAverage, resetMovingAverage } = require("./technical-indicators/moving-average");
const { eMovingAverage, resetEMovingAverage, getTrendFromEma } = require("./technical-indicators/exponential-moving-average");

const parseCandleData = (candleData) => {
  const { date, open, high, low, close } = candleData;
  return {
    date: moment(date),
    open: parseInt(open),
    high: parseInt(high),
    low: parseInt(low),
    close: parseInt(close),
  };
};

const priceIndicators = (candateData) => ({
  sma: movingAverage(candateData.open),
  ema: eMovingAverage(candateData.open),
  trend: getTrendFromEma(),
});

function readCsvInBatches(filePath, processBatch, endProccessing) {
  const batch = [];
  let batchDate;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      const candleData = parseCandleData(row);
      Object.assign(candleData, priceIndicators(candleData));

      if (!batchDate) {
        batchDate = candleData.date;
      }

      if (batchDate.isSame(candleData.date, "day")) {
        batch.push(candleData);
      } else {
        processBatch([...batch]);
        batch.length = 0; // Clear the batch

        batch.push(candleData);
        batchDate = candleData.date;
      }
    })
    .on("end", () => {
      if (batch.length > 0) {
        processBatch(batch); // Process remaining rows
      }

      resetMovingAverage();
      resetEMovingAverage();
      endProccessing && endProccessing();
    })
    .on("error", (err) => {
      console.error("Error reading CSV file:", err);
    });
}

module.exports = { readCsvInBatches };
