const fs = require("fs");
const csv = require("csv-parser");
const moment = require("moment");

const formatCandleData = (candleData) => {
  const { date, open, high, low, close } = candleData;
  return {
    date: moment(date),
    open: parseInt(open),
    high: parseInt(high),
    low: parseInt(low),
    close: parseInt(close),
  };
}

function readCsvInBatches(filePath, processBatch, endProccessing) {
  const batch = [];
  let batchDate;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      const candleData = formatCandleData(row);
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

      endProccessing && endProccessing();
    })
    .on("error", (err) => {
      console.error("Error reading CSV file:", err);
    });
}

module.exports = { readCsvInBatches };
