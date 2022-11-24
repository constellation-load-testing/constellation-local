const teardownHome = require("./teardownHomeCommand.js");
const teardownRemote = require("./teardownRemoteCommand.js");
const { devLog } = require("../scripts/loggers");

const teardownAll = async (options) => {
  // isDev, if truthy, will show the raw logs, hidden from user
  devLog(options);

  await teardownRemote(options);
  await teardownHome(options);

  devLog("Destroyed all infrastructure");
};

module.exports = teardownAll;
