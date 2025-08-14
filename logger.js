const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf, colorize } = format;

const customFormat = printf(info => {
  const message = Array.isArray(info.message)
    ? info.message.join(" ")
    : info.message;

  return message;
});

// Allow multiple arguments to be captured
const splat = format((info) => {
  if (info[Symbol.for('splat')]) {
    info.message = [info.message, ...info[Symbol.for('splat')]];
  }
  return info;
});

let logger;
const setLogger = (fileName) => {
  logger = createLogger({
    level: "info",
    format: combine(
      label({ label: 'Strategy Test' }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      splat(),
      colorize(),
      customFormat
    ),
    defaultMeta: { service: "user-service" },
    transports: [
      // new transports.File({ filename: "./logs/errors.log", level: "error" }),
      new transports.File({ filename: `./logs/${fileName}` }),
      // new transports.Console({ format: winston.format.simple() }),
    ],
  });

  return logger;
};

const getLogger = () => logger;

const logInfo = (...params) => {
  // console.log(...params);
  logger.info(...params);
}

module.exports = { setLogger, getLogger, logInfo };
