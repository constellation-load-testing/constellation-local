const path = require("path");
const gradient = require("gradient-string");
const readWriteConfigFile = require("../scripts/readWriteConfigFile");
const { sh } = require("../scripts/sh");
const { devLog } = require("../scripts/loggers");
const { logo } = require("../constants/logo.js");
const {
  createOraInstance,
  initMsgManipulation,
  intervalledMsgManipulation,
} = require("./helpers/cliHelpers.js");

const init = async (options) => {
  const { ora, chalk } = await require("./helpers/esmodules.js")();

  devLog(options);
  if (options.log) {
    process.env.LOG_LEVEL = "raw";
  }
  const isRaw = process.env.LOG_LEVEL === "raw" ? true : false;

  // ORA
  const header = createOraInstance(ora, {
    text: chalk.hex("#f7a11b").bold("Initializing Constellation..."),
    spinner: "earth",
  }).start();

  const { appendMsg, replaceMsg } = initMsgManipulation(
    chalk.hex("#fddb45"),
    header
  );

  // MESSAGES & PROCESSES
  // Installing lambda assets
  header.text = appendMsg("Home Stack Assets -🟠 Installing");
  const awsPath = path.resolve(__dirname, "..", "aws");
  await sh(`(cd ${awsPath}/lambda/orchestrator && npm install)`, isRaw);
  devLog("Installed orchestrator node_modules");
  header.text = replaceMsg("Home Stack Assets -🟢 Installed");

  const HOME_REGION = require("../config.json").HOME_REGION;
  const intervalId = intervalledMsgManipulation({
    appendMsg,
    replaceMsg,
    oraInstance: header,
    initialMessage: `Home Region Infrastructure (${HOME_REGION}) -🟠 Deploying`,
    keyword: HOME_REGION,
    minMS: 60 * 1000,
    maxMS: 100 * 1000,
  });

  // deploying home infrastructure
  await sh(`(cd ${awsPath} && cdk deploy \"*Home*\")`, isRaw);
  devLog("Deployed home infrastructure");
  clearInterval(intervalId);
  header.text = replaceMsg(
    `Home Region Infrastructure (${HOME_REGION}) -🟢 Deployed (100%)`
  );

  // initializing proper state on home components
  header.text = appendMsg(
    `Initializing Home Region Components (${HOME_REGION}) -🟠 Initializing`
  );
  const initializeDynamoDB = require("../scripts/initializeDynamoDB.js");
  const initializeTimestreamDB = require("../scripts/initializeTimestreamDB.js");
  await initializeDynamoDB();
  await initializeTimestreamDB();
  header.text = replaceMsg(
    `Initializing Home Region Components (${HOME_REGION}) -🟢 Initialized`
  );

  header.text = appendMsg("Completed Initialization, ready to run test... 📜");
  header.stopAndPersist({
    symbol: "✅ ",
  });
  return;
};

module.exports = init;
