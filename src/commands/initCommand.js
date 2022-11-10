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

  // isDev, if truthy, will show the raw logs, hidden from user
  devLog(options);
  // options.log is either true or false
  if (options.log) {
    process.env.LOG_LEVEL = "raw";
  }
  const isRaw = process.env.LOG_LEVEL === "raw" ? true : false;

  console.log(gradient.summer(logo));

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
  header.text = appendMsg("Config json file -🟠 Validating");
  const configPath = options.config;
  await readWriteConfigFile(configPath);
  header.text = replaceMsg("Config json file -🟢 Validated");

  const awsPath = path.resolve(__dirname, "..", "aws");
  devLog(`Changing directory to AWS: ${awsPath}`);

  header.text = appendMsg("AWS CDK Bootstrap -🟠 Processing");
  await sh(`(cd ${awsPath} && cdk bootstrap)`, isRaw);
  devLog(`Bootstrap complete`);
  header.text = replaceMsg("AWS CDK Bootstrap -🟢 Completed");

  header.text = appendMsg("AWS CDK Bootstrap Manual Checks -🟠 Processing");
  const s3StagingBucketCheck = require("../scripts/S3StagingBucketCheck.js");
  await s3StagingBucketCheck();
  devLog("Staging Bucket Check Complete");
  header.text = replaceMsg("AWS CDK Bootstrap Manual Checks -🟢 Completed");

  header.text = appendMsg("Home Stack Assets -🟠 Installing");
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
    minMS: 50 * 1000,
    maxMS: 70 * 1000,
  });

  await sh(`(cd ${awsPath} && cdk deploy \"*Home*\")`, isRaw);
  devLog("Deployed home infrastructure");
  clearInterval(intervalId);
  header.text = replaceMsg(
    `Home Region Infrastructure (${HOME_REGION}) -🟢 Deployed (100%)`
  );

  header.text = appendMsg(
    `Home Region Components (${HOME_REGION}) -🟠 Initializing`
  );
  const initializeDynamoDB = require("../scripts/initializeDynamoDB.js");
  const initializeTimestreamDB = require("../scripts/initializeTimestreamDB.js");
  await initializeDynamoDB();
  await initializeTimestreamDB();
  header.text = replaceMsg(
    `Home Region Components (${HOME_REGION}) -🟢 Initialized`
  );

  header.text = appendMsg("Completed Initialization, ready to run test... 📜");
  header.stopAndPersist({
    symbol: "✅ ",
  });
  return;
};

module.exports = init;
