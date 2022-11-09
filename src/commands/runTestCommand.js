const fs = require("fs").promises;
const { sh } = require("../scripts/sh");
const path = require("path");

const runTest = async (options) => {
  const testPath = options.script;

  // get the contents of the file first from testPath
  const testFile = await fs.readFile(testPath, "utf8");
  console.log("File fetched from: ", testFile);

  // write the file to appropriate path
  await fs.writeFile(path.join(__dirname, "../script.js"), testFile, "utf8");
  console.log("Config file written to: ", path.join(__dirname, "../script.js"));

  // upload to s3
  const createS3AndUploadScript = require("../scripts/createS3AndUploadScript.js");
  await createS3AndUploadScript();
  console.log("Uploaded script to S3");

  // Deploy remote regions (in parallel)
  const config = require("../config.json");
  const REMOTE_REGIONS = Object.keys(config.REMOTE_REGIONS);
  const awsPath = path.resolve(__dirname, "..", "aws");
  console.log("AWS Path: ", awsPath);

  const shellPromises = REMOTE_REGIONS.map((region) => {
    const command = `(cd ${awsPath} && cdk deploy -f \"*${region}*\")`;
    return sh(command)
      .then(() => {
        console.log(`Deployed ${region} infrastructure`);
      })
      .catch((err) => {
        console.log(`Error deploying ${region} infrastructure`, err);
      });
  });

  await Promise.allSettled(shellPromises);
  console.log("Deployed remote regions");
};

module.exports = runTest;
