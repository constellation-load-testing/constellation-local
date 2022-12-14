const path = require("path");
const { sh } = require("../scripts/sh");
const { devLog } = require("../scripts/loggers");
const {
  createOraInstance,
  initMsgManipulation,
  intervalledMsgManipulation,
} = require("./helpers/cliHelpers.js");

const teardownRemote = async (options) => {
  // ES MODULES
  const { ora, chalk } = await require("./helpers/esmodules.js")();

  // LOG CONFIGS
  devLog(options);
  if (options.log) {
    process.env.LOG_LEVEL = "raw";
  }
  const isRaw = process.env.LOG_LEVEL === "raw" ? true : false;

  // ORA
  const header = createOraInstance(ora, {
    text: chalk.hex("#f7a11b").bold("Tearing down all remote regions..."),
    spinner: "earth",
  }).start();

  const { appendMsg, replaceMsg } = initMsgManipulation(
    chalk.hex("#fddb45"),
    header
  );

  // Deploy remote regions (in parallel)
  const config = require("../config.json");
  const REMOTE_REGIONS = Object.keys(config.REMOTE_REGIONS);
  const awsPath = path.resolve(__dirname, "..", "aws");
  devLog("AWS Path: ", awsPath);

  header.text = appendMsg("Deprovisioning remote regions -🟠 Deprovisioning");
  const shellPromises = REMOTE_REGIONS.map((region) => {
    const whiteSpaceCount = 15 - region.length;
    const message = ":: " + region + " ".repeat(whiteSpaceCount) + "-";
    const intervalId = intervalledMsgManipulation({
      appendMsg,
      replaceMsg,
      oraInstance: header,
      initialMessage: message,
      keyword: region,
      minMS: 300 * 1000,
      maxMS: 540 * 1000, // conservative range is 5-9 mins for each region
    });

    const command = `(cd ${awsPath} && cdk destroy -f \"*${region}*\")`;
    return sh(command, isRaw)
      .then(() => {
        devLog(`Destroyed ${region} infrastructure`);
        clearInterval(intervalId);
        header.text = replaceMsg(`${message} (100%) 🛠️`, region);
      })
      .catch((err) => {
        devLog(`Error destroying ${region} infrastructure`, err);
        clearInterval(intervalId);
        header.text = replaceMsg(
          `${message} 🔴 Failed! - Please wait for all deployment to finish and run teardown-all command or visit the CloudFormation AWS and manually delete the stacks`,
          region
        );
      });
  });

  await Promise.allSettled(shellPromises);
  devLog("Destroyed remote regions");
  header.text = replaceMsg(
    "Deprovisioning remote regions -🟢 Deprovisioned",
    "Deprovisioning"
  );

  header.text = appendMsg("Completed all remote region teardowns... 🛠️");
  header.stopAndPersist({
    symbol: "✅ ",
  });
  return;
};

module.exports = teardownRemote;
