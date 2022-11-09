/**
 * This script is used to destroy the **remote** infrastructure in parallel!
 */

const { sh } = require("./utils/sh");
const path = require("path");
const config = require("../config.json");
const REMOTE_REGIONS = Object.keys(config.REMOTE_REGIONS);

const destroyRemoteInfraParallel = async () => {
  const awsPath = path.resolve(__dirname, "..", "aws");
  const commands = REMOTE_REGIONS.map(
    (region) => `(cd ${awsPath} && cdk destroy -f \"*${region}*\")`
  );
  const shellPromises = commands.map((command) => sh(command));
  await Promise.all(shellPromises);
};

destroyRemoteInfraParallel();
