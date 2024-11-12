const pino = require("pino");
const pretty = require("pino-pretty");

const logger = (defaultConfig) =>
  pino(
    {
      ...defaultConfig,
      messageKey: "message",
      mixin: () => ({ name: "brm-app" }),
    },
    pretty({
      colorize: true,
    })
  );

module.exports = {
  logger,
};
