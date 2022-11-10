const path = require("path");
const gradient = require("gradient-string");
const readWriteConfigFile = require("../scripts/readWriteConfigFile");
const { sh } = require("../scripts/sh");
const { devLog } = require("../scripts/loggers");
const { logo } = require("../constants/logo.js");
const {
  createOraInstance,
  initMsgManipulation,
} = require("./helpers/cliHelpers.js");

const init = async (options) => {
  const { ora, chalk } = await require("./helpers/esmodules.js")();

  // isDev, if truthy, will show the raw logs, hidden from user
  devLog(options);
  process.env.LOG_LEVEL = options.log;
  const isRaw = process.env.LOG_LEVEL === "raw" ? true : false;

  console.log(gradient.summer(logo));

  const header = createOraInstance(ora, {
    text: chalk.hex("#f7a11b").bold("Initializing Constellation"),
    spinner: "earth",
  }).start();

  const { appendMsg, replaceMsg } = initMsgManipulation(
    chalk.hex("#fddb45"),
    header
  );

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

  // TODO: Display home region to the user
  // TODO: Display expected deployment time (or even pct to complete due to predictability of dep-duration)
  header.text = appendMsg("Home Region Infrastructure -🟠 Deploying");
  await sh(`(cd ${awsPath} && cdk deploy \"*Home*\")`, isRaw);
  devLog("Deployed home infrastructure");
  header.text = replaceMsg("Home Region Infrastructure -🟢 Deployed");

  header.text = appendMsg("Home Region Components -🟠 Initializing");
  const initializeDynamoDB = require("../scripts/initializeDynamoDB.js");
  const initializeTimestreamDB = require("../scripts/initializeTimestreamDB.js");
  await initializeDynamoDB();
  await initializeTimestreamDB();
  header.text = replaceMsg("Home Region Components -🟢 Initialized");

  header.text = appendMsg("Completed Initialization");
  header.stopAndPersist({
    symbol: "✅ ",
  });
};

module.exports = init;
