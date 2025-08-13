const { logInfo } = require("./logger");

// const moment = require("moment");
// const { delay } = require("./delay");

const {
  LOT_SIZE,
  NUM_OF_LOTS,
  TAX_AND_BROKERAGE_PER_TRADE,
  TARGET,
  TRAILING_STOPLOSS,
  TRAIL_STOPLOSS_AT_MARKET_MOVEMENT,
  STOPLOSS,
  DAY_STOPLOSS,
  NUM_OF_TRADE_IN_A_DAY,
  START_DAY_TRADE_AFTER_MINUTES,
  DURATION_BETWEEN_TRADES_IN_MINUTES,
}= require("./config");

const formattedDate = (date) => date ? `${date.format("MMM DD, YYYY ddd HH:mm:ss")}` : "";

const tradeDecision = (previousTrades) => {
  const recentTrade = previousTrades[previousTrades.length - 1];
  // const previousToRecent = previousTrades[previousTrades.length - 2];

  if (recentTrade?.stoplossHit) {
    return recentTrade.buyOrSell * -1;
    // if (previousToRecent?.stoplossHit) {
    //   if (recentTrade?.buyOrSell === previousToRecent?.buyOrSell) {
    //     return recentTrade.buyOrSell * -1;
    //   } else {
    //     return recentTrade.buyOrSell;
    //   }
    // } else {
    //   return recentTrade.buyOrSell * -1;
    // }
  } else if (recentTrade?.targetHit) {
    return recentTrade.buyOrSell;
  }

  const randomNumber = (n) => parseInt(Math.random() * n);

  const random100 = randomNumber(100);
  return random100 > 50 ? 1 : -1; // 1 => buy and -1 => sell
};

const trade = (candlesData, target, initialStoploss, previousTrades) => {
  let stoploss = initialStoploss;
  let trailingStoploss = TRAIL_STOPLOSS_AT_MARKET_MOVEMENT;

  const { open: tradePrice } = candlesData[0];
  const buyOrSell = tradeDecision(previousTrades);

  const checkPnl = (currentPrice, high, low) => {
    if (buyOrSell === 1) {
      if (low - tradePrice <= stoploss) return stoploss;
      if (high - tradePrice >= target) return target;
    } else if (buyOrSell === -1) {
      if (tradePrice - high <= stoploss) return stoploss;
      if (tradePrice - low >= target) return target;
    }

    return (currentPrice - tradePrice) * buyOrSell;
  }

  let pnl = 0;
  let index = 0;
  let tradeDetails = {};
  for (index = 0; index < candlesData.length; index++) {
    const { close: currentPrice, high, low, date } = candlesData[index];
    pnl = checkPnl(currentPrice, high, low);

    tradeDetails = { buyOrSell, tradePrice, exitPrice: currentPrice };
    if (pnl <= stoploss) {
      return { pnl: stoploss, index, stoplossHit: 1, ...tradeDetails };
    }

    if (pnl >= target) {
      return { pnl: target, index, targetHit: 1, ...tradeDetails };
    }

    if (pnl >= trailingStoploss) {
      const newStoploss = trailingStoploss - TRAILING_STOPLOSS;
      if (newStoploss > stoploss) {
        stoploss = newStoploss;
      }
      trailingStoploss += TRAIL_STOPLOSS_AT_MARKET_MOVEMENT;
    }
  }

  return { pnl, index, ...tradeDetails };
}

const backtest = (data = []) => {
  if (!data.length) return;

  let candlesData = data.slice(START_DAY_TRADE_AFTER_MINUTES);
  logInfo(
    `Date: ${formattedDate(candlesData[0]?.date)} - ${formattedDate(candlesData[candlesData.length - 1]?.date)}`
  );

  const calculateAmount = (priceChange) => LOT_SIZE * NUM_OF_LOTS * priceChange;

  let dayPnl = 0;
  let index = 0;
  let stoplossCount = 0;
  let targetCount = 0;
  // let previousTrade;
  const previousTrades = [];
  let totalTrades = 0;
  for (index = 0; index < candlesData.length; index++) {
    const tradeResult = trade(candlesData.slice(index), TARGET, STOPLOSS, previousTrades);
    totalTrades += 1;
    const {
      pnl,
      index: nextIndex,
      buyOrSell,
      targetHit,
      stoplossHit,
      tradePrice,
      exitPrice,
    } = tradeResult;

    dayPnl += calculateAmount(pnl) - TAX_AND_BROKERAGE_PER_TRADE;

    logInfo(`${formattedDate(candlesData[index]?.date)} - ${formattedDate(candlesData[index + nextIndex]?.date)}`);
    logInfo(
      "TRADE",
      buyOrSell === 1 ? "BUY" : "SELL",
      pnl,
      `| Day's P&L: ${dayPnl}`,
      `| NIFTY: ${tradePrice} - ${exitPrice}`
    );

    // wait for few minute before executing next trade.
    index += nextIndex + DURATION_BETWEEN_TRADES_IN_MINUTES;
    stoplossCount += stoplossHit || 0;
    targetCount += targetHit || 0;
    // previousTrade = tradeResult;
    previousTrades.push(tradeResult);
    if (previousTrades.length > 2) {
      previousTrades.shift();
    }

    if (DAY_STOPLOSS && dayPnl < DAY_STOPLOSS) break;
  }

  return {
    pnl: dayPnl,
    targetCount,
    stoplossCount,
    totalTrades,
  };
};

module.exports = {
  backtest,
}
