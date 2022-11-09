const path = require("path");
const { sh } = require("../scripts/utils/sh");

const teardownRemote = async () => {
  // Deploy remote regions (in parallel)
  const config = require("../config.json");
  const REMOTE_REGIONS = Object.keys(config.REMOTE_REGIONS);
  const awsPath = path.resolve(__dirname, "..", "aws");
  console.log("AWS Path: ", awsPath);

  const shellPromises = REMOTE_REGIONS.map((region) => {
    const command = `(cd ${awsPath} && cdk destroy -f \"*${region}*\")`;
    return sh(command)
      .then(() => {
        console.log(`Destroyed ${region} infrastructure`);
      })
      .catch((err) => {
        console.log(`Error destroying ${region} infrastructure`, err);
      });
  });

  await Promise.allSettled(shellPromises);
  console.log("Destroyed remote regions");
};

module.exports = teardownRemote;
