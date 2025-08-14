const cliProgress = require("cli-progress");
const colors = require("ansi-colors");

const setupProgress = (params) => {
  const { FILE_NAME, SAMPLE_SIZE } = params;

  const bar = new cliProgress.SingleBar({
    format: `Backtesting Progress | ${FILE_NAME} |` + colors.cyan("{bar}") + "| {percentage}% | {value}/{total} Simulations",
    hideCursor: true
  }, cliProgress.Presets.shades_classic);

  bar.start(SAMPLE_SIZE, 0);

  return bar;
}

module.exports = { setupProgress };
