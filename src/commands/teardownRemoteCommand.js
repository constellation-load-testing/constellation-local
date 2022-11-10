const path = require("path");
const { sh } = require("../scripts/sh");
const { devLog } = require("../scripts/loggers");

const teardownRemote = async (options) => {
  devLog(options);
  if (options.log) {
    process.env.LOG_LEVEL = "raw";
  }
  const isRaw = process.env.LOG_LEVEL === "raw" ? true : false;

  // Deploy remote regions (in parallel)
  const config = require("../config.json");
  const REMOTE_REGIONS = Object.keys(config.REMOTE_REGIONS);
  const awsPath = path.resolve(__dirname, "..", "aws");
  devLog("AWS Path: ", awsPath);

  const shellPromises = REMOTE_REGIONS.map((region) => {
    const command = `(cd ${awsPath} && cdk destroy -f \"*${region}*\")`;
    return sh(command, isRaw)
      .then(() => {
        devLog(`Destroyed ${region} infrastructure`);
      })
      .catch((err) => {
        devLog(`Error destroying ${region} infrastructure`, err);
      });
  });

  await Promise.allSettled(shellPromises);
  devLog("Destroyed remote regions");
};

module.exports = teardownRemote;
