const getArg = (argument) => {
  const value = process.argv.find(arg => arg.match(`^${argument}=`));
  return value && value.replace(`${argument}=`, '');
};

const configArgs = [
  {
    name: "FILE_NAME",
    arg: "file",
    defaultValue: "NIFTY_50_2023.csv",
    parser: (str) => String(str),
  },
  {
    name: "SAMPLE_SIZE",
    arg: "sample-size",
    defaultValue: 1,
  },
  {
    name: "LOT_SIZE",
    arg: "lot-size",
    defaultValue: 75,
  },
  {
    name: "NUM_OF_LOTS",
    arg: "lots",
    defaultValue: 1,
  },
  {
    name: "TAX_AND_BROKERAGE_PER_TRADE",
    arg: "deductions",
    defaultValue: 80,
  },
  {
    name: "TARGET",
    arg: "target",
    defaultValue: 200,
  },
  {
    name: "STOPLOSS",
    arg: "stoploss",
    defaultValue: -50,
  },
  {
    name: "TRAILING_STOPLOSS",
    arg: "trailing-stoploss",
    defaultValue: 75,
  },
  {
    name: "TRAIL_STOPLOSS_AT_MARKET_MOVEMENT",
    arg: "trail-stoploss-at",
    defaultValue: 25,
  },
  {
    name: "DAY_STOPLOSS",
    arg: "day-stoploss",
    defaultValue: 0,
  },
  {
    name: "NUM_OF_TRADE_IN_A_DAY",
    arg: "day-trades-limit",
    defaultValue: 0,
  },
  {
    name: "START_DAY_TRADE_AFTER_MINUTES",
    arg: "start-time",
    defaultValue: 45,
  },
  {
    name: "DURATION_BETWEEN_TRADES_IN_MINUTES",
    arg: "trade-interval",
    defaultValue: 5,
  },
  {
    name: "MOVING_AVERAGE",
    arg: "moving-average",
    defaultValue: 200,
  },
  {
    name: "TRADE_DECISION",
    arg: "trade-decision",
    defaultValue: "ma",
    parser: (str) => String(str),
  }
];

const strategyConfig = configArgs.reduce((obj, param) => {
  const defaultParser = parseInt;
  const { name, arg, defaultValue, parser = defaultParser } = param;
  const argValue = getArg(arg);

  obj[name] = (argValue && parser(argValue)) || defaultValue;
  return obj;
}, {});

module.exports = strategyConfig;
