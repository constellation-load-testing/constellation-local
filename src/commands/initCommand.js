const path = require("path");
const gradient = require("gradient-string");
const readWriteConfigFile = require("../scripts/readWriteConfigFile");
const { sh } = require("../scripts/sh");
const { devLog } = require("../scripts/loggers");
const { logo } = require("../constants/logo.js");

// chalk.hex("#fddb45")
const initMsgManipulation = (fn, oraInstance) => {
  const appendMsg = (message) => {
    const newOraInstanceText = oraInstance.text + "\n" + fn(`✨  ${message}`);
    // header.text = newHeader;
    return newOraInstanceText;
  };

  const replaceMsg = (message) => {
    // split by "\n"
    const textArr = oraInstance.text.split("\n");
    // replace last element with message
    textArr[textArr.length - 1] = fn(`✨  ${message}`);
    const newOraInstanceText = textArr.join("\n");
    return newOraInstanceText;
  };

  return {
    appendMsg,
    replaceMsg,
  };
};

const init = async (options) => {
  const { ora, chalk } = await require("./esmodules.js")();

  console.log(gradient.summer(logo));

  // create high level throbber
  // let message = chalk.hex("#f7a11b").bold("Initializing Constellation");
  const header = ora({
    text: chalk.hex("#f7a11b").bold("Initializing Constellation"),
    spinner: "earth",
  }).start();

  const { appendMsg, replaceMsg } = initMsgManipulation(
    chalk.hex("#fddb45"),
    header
  );

  // set up runner for ora, from config file to

  // mutate the process.env global variable based on options
  devLog(options);

  // either, undefined, "dev" or "raw"
  process.env.LOG_LEVEL = options.log;

  // isDev, if truthy, will show the raw logs, hidden from user
  const isRaw = process.env.LOG_LEVEL === "raw" ? true : false;

  const configPath = options.config;

  header.text = appendMsg("Config json file -🟠 Validating");
  await readWriteConfigFile(configPath);
  header.text = replaceMsg("Config json file -🟢 Validated");

  // bootstrap the required regions
  // - we want to bootstrap inside the aws folder
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

  // install the orchestrator node_modules
  header.text = appendMsg("Home Stack Assets -🟠 Installing");
  await sh(`(cd ${awsPath}/lambda/orchestrator && npm install)`, isRaw);
  devLog("Installed orchestrator node_modules");
  header.text = replaceMsg("Home Stack Assets -🟢 Installed");

  // deploy the home infrastructure
  header.text = appendMsg("Home Region Infrastructure -🟠 Deploying");
  await sh(`(cd ${awsPath} && cdk deploy \"*Home*\")`, isRaw);
  devLog("Deployed home infrastructure");
  header.text = replaceMsg("Home Region Infrastructure -🟢 Deployed");

  // run the home initialization scripts (excluding the s3 upload)
  // these all have logs inside at the moment
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
