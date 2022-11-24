const fs = require("fs").promises;
const path = require("path");
const { sh } = require("../scripts/sh");
const { devLog } = require("../scripts/loggers");
const {
  createOraInstance,
  initMsgManipulation,
  intervalledMsgManipulation,
} = require("./helpers/cliHelpers.js");

const runVisualizer = async () => {
  const { ora, chalk } = await require("./helpers/esmodules.js")();
  const header = createOraInstance(ora, {
    text: chalk.hex("#f7a11b").bold("Visualizing Data..."),
    spinner: "earth",
  }).start();

  const { appendMsg, replaceMsg } = initMsgManipulation(
    chalk.hex("#fddb45"),
    header
  );

  const serverPath = path.resolve(__dirname, "..", "..", "backend/server.js");

  const command = `node ${serverPath}`;
  return sh(command).catch((err) => {
    devLog("Error initializing visualizer", err);
    header.text = replaceMsg("Visualizing Data - failed to run server 🚨");
    header.stopAndPersist({
      symbol: "❌ ",
    });
  });
};

module.exports = runVisualizer;
