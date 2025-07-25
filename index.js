const configParameters = require("./config");
const {
  FILE_NAME,
  SAMPLE_SIZE
} = configParameters;

const moment = require("moment");
const { setLogger, logInfo } = require("./logger");
const currentTimestamp = moment().format("_YYYYMMDDHHmm");
const logFileName = FILE_NAME.replace(/.csv$/, `${currentTimestamp}.log`);
setLogger(logFileName);

const { backtest } = require("./strategy");
const { readCsvInBatches } = require("./read_file");
const { delay } = require("./delay");

const calculateWinningProbability = (totalTargetCount, totalStoplossCount) =>
  (totalTargetCount + totalStoplossCount) > 0
  ? totalTargetCount * 100 / (totalTargetCount + totalStoplossCount)
  : 0;

const processBatch = (filePath) => {
  let totalPnl = 0;
  let totalTargetCount = 0;
  let totalStoplossCount = 0;
  let maxDrawDown = 0;
  let totalTrades = 0;

  return new Promise((resolve, reject) => {
    readCsvInBatches(
      filePath,
      (data) => {
        const { pnl, targetCount, stoplossCount, totalTrades: noOfTrades } = backtest(data);

        totalPnl += pnl;
        totalTargetCount += targetCount;
        totalStoplossCount += stoplossCount;
        maxDrawDown = totalPnl < maxDrawDown ? totalPnl : maxDrawDown;
        totalTrades += noOfTrades;

        const winningProbability = calculateWinningProbability(
          totalTargetCount,
          totalStoplossCount,
        ).toFixed(2);

        logInfo(
          `Total P&L: ${totalPnl}`,
          `| TRGT: ${totalTargetCount}, SL: ${totalStoplossCount}`,
          `| Winning Probability: ${winningProbability}%`,
          `| Max Draw Down: ${maxDrawDown}`,
          `| Total Trades: ${totalTrades}`
        );
        logInfo("=======================================");

        // delay(1000);
      },
      () => {
        resolve({
          totalPnl,
          totalTargetCount,
          totalStoplossCount,
          winningProbability: calculateWinningProbability(totalTargetCount, totalStoplossCount),
          maxDrawDown,
          totalTrades,
        });
      }
    );
  });
}

(async () => {
  let averages = {
    totalPnl: 0,
    winningProbability: 0,
    maxDrawDown: 0,
    totalTrades: 0,
  };

  const pnlArray = [];
  for (let i = 0; i < SAMPLE_SIZE; i++) {
    const backtestResult = await processBatch(`./data_dumps/${FILE_NAME}`);

    Object.keys(averages).forEach((param) => {
      averages[param] += backtestResult[param] || 0;
    });

    pnlArray.push(backtestResult.totalPnl);
  }

  averages = Object.keys(averages).reduce((result, param) => {
    result[param] = averages[param] / SAMPLE_SIZE;
    return result;
  }, {});

  averages.standardDeviation = calculateStandardDeviation(pnlArray);

  logInfo(`Averages (Sample Size: ${SAMPLE_SIZE})`);
  Object.entries(averages).forEach(([param, value]) => logInfo(`${param}:`, value));
  Object.entries(configParameters).forEach(([param, value]) => logInfo(`${param}:`, value));

  logInfo("---------------------------------------");
  logInfo("Average P&L:", averages.totalPnl, pnlArray);
})();

const calculateStandardDeviation = (numbers) => {
  // Step 1: Calculate the mean (average)
  const mean = numbers.reduce((sum, value) => sum + value, 0) / numbers.length;

  // Step 2: Calculate the squared differences from the mean
  const squaredDiffs = numbers.map(value => Math.pow(value - mean, 2));

  // Step 3: Calculate the average of the squared differences (variance)
  const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / numbers.length;

  // Step 4: Take the square root of the variance (standard deviation)
  const standardDeviation = Math.sqrt(variance);

  return standardDeviation;
}
