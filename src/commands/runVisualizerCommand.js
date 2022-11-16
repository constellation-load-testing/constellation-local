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
  const serverPath = path.resolve(__dirname, "..", "..", "backend/server.js");

  const command = `node ${serverPath}`;
  return sh(command)
    .then(() => {
      devLog(`Deployed ${region} infrastructure`);
      clearInterval(intervalId);
      header.text = replaceMsg(`${message} (100%) 🛠️`, region);
    })
    .catch((err) => {
      devLog('Error initializing visualizer', err);
      clearInterval(intervalId);
      header.text = replaceMsg(
        `${message} 🔴 Failed! - Please wait for all deployment to finish and run teardown-all command or visit the CloudFormation AWS and manually delete the stacks`,
        region
      );
    });
};


module.exports = runVisualizer;
