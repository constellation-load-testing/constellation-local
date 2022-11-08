const teardownHome = require("./teardownHomeCommand.js");
const teardownRemote = require("./teardownRemoteCommand.js");

const teardownAll = async () => {
  await teardownRemote();
  await teardownHome();
  console.log("Destroyed all infrastructure");
};

module.exports = teardownAll;