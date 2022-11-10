const path = require("path");
const { sh } = require("../scripts/sh");
const { devLog } = require("../scripts/loggers");
const {
  createOraInstance,
  initMsgManipulation,
  intervalledMsgManipulation,
} = require("./helpers/cliHelpers.js");

const teardownHome = async (options) => {
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
    text: chalk
      .hex("#f7a11b")
      .bold("Tearing down home region infrastructure!..."),
    spinner: "earth",
  }).start();

  const { appendMsg, replaceMsg } = initMsgManipulation(
    chalk.hex("#fddb45"),
    header
  );

  header.text = appendMsg("Clearing Home Components -🟠 Clearing");
  // clean up home components before destroying
  const clearAndDeleteS3 = require("../scripts/clearAndDeleteS3.js");
  const clearTimestream = require("../scripts/clearTimestream.js");
  await clearAndDeleteS3();
  await clearTimestream();
  header.text = replaceMsg("Clearing Home Components -🟢 Cleared");

  const HOME_REGION = require("../config.json").HOME_REGION;
  const intervalId = intervalledMsgManipulation({
    appendMsg,
    replaceMsg,
    oraInstance: header,
    initialMessage: `Home Region Infrastructure (${HOME_REGION}) -🟠 Deprovisioning`,
    keyword: HOME_REGION,
    minMS: 50 * 1000,
    maxMS: 70 * 1000,
  });
  // destroy home infrastructure
  const awsPath = path.resolve(__dirname, "..", "aws");
  devLog("AWS Path: ", awsPath);
  await sh(`(cd ${awsPath} && cdk destroy -f \"*Home*\")`, isRaw);
  devLog("Destroyed home infrastructure");
  clearInterval(intervalId);
  header.text = replaceMsg(
    `Home Region Infrastructure (${HOME_REGION}) -🟢 Deprovisioned (100%)`
  );
  header.text = appendMsg("Completed Home region teardown... 🛠️");
  header.stopAndPersist({
    symbol: "✅ ",
  });
  return;
};

module.exports = teardownHome;
