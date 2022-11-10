const fs = require("fs").promises;
const path = require("path");
const { sh } = require("../scripts/sh");
const { devLog } = require("../scripts/loggers");
const {
  createOraInstance,
  initMsgManipulation,
  intervalledMsgManipulation,
} = require("./helpers/cliHelpers.js");

const runTest = async (options) => {
  const { ora, chalk } = await require("./helpers/esmodules.js")();

  // isDev, if truthy, will show the raw logs, hidden from user
  devLog(options);
  if (options.log) {
    process.env.LOG_LEVEL = "raw";
  }
  const isRaw = process.env.LOG_LEVEL === "raw" ? true : false;

  // ORA
  const header = createOraInstance(ora, {
    text: chalk.hex("#f7a11b").bold("Preparing Constellation for test..."),
    spinner: "earth",
  }).start();

  const { appendMsg, replaceMsg } = initMsgManipulation(
    chalk.hex("#fddb45"),
    header
  );

  // MESSAGES & PROCESSES
  header.text = appendMsg("Script js file -🟠 Validating");
  const testPath = options.script;
  const testFile = await fs.readFile(testPath, "utf8");
  devLog("File fetched from: ", testFile);

  // write the file to appropriate path
  await fs.writeFile(path.join(__dirname, "../script.js"), testFile, "utf8");
  devLog("Config file written to: ", path.join(__dirname, "../script.js"));
  header.text = replaceMsg("Script js file -🟢 Validated");

  header.text = appendMsg("Uploading script to cloud -🟠 Uploading");
  const createS3AndUploadScript = require("../scripts/createS3AndUploadScript.js");
  await createS3AndUploadScript();
  devLog("Uploaded script to S3");
  header.text = replaceMsg("Uploading script to cloud -🟢 Uploaded");

  // Deploy remote regions (in parallel)
  const config = require("../config.json");
  const REMOTE_REGIONS = Object.keys(config.REMOTE_REGIONS);
  const awsPath = path.resolve(__dirname, "..", "aws");
  devLog("AWS Path: ", awsPath);

  const shellPromises = REMOTE_REGIONS.map((region) => {
    const intervalId = intervalledMsgManipulation({
      appendMsg,
      replaceMsg,
      oraInstance: header,
      initialMessage: `Remote Region Infrastructure (${region}) -🟠 Deploying (0%)`,
      keyword: region,
      minMS: 300 * 1000,
      maxMS: 400 * 1000, // conservative range is 300 to 400s for each region
    });

    const command = `(cd ${awsPath} && cdk deploy -f \"*${region}*\")`;
    return sh(command, isRaw)
      .then(() => {
        devLog(`Deployed ${region} infrastructure`);
        clearInterval(intervalId);
        header.text = replaceMsg(
          `Remote Region Infrastructure (${region}) -🟢 Deployed (100%)`,
          region
        );
      })
      .catch((err) => {
        devLog(`Error deploying ${region} infrastructure`, err);
        clearInterval(intervalId);
        header.text = replaceMsg(
          `Remote Region Infrastructure (${region}) -🔴 Failed! - Please wait for all deployment to finish and run teardown-all command`,
          region
        );
      });
  });

  await Promise.allSettled(shellPromises);
  devLog("Deployed remote regions");

  header.text = appendMsg(
    "Contellation now running test, ready for visualization... 🕵️"
  );
  header.stopAndPersist({
    symbol: "✅ ",
  });
  return;
};

module.exports = runTest;
