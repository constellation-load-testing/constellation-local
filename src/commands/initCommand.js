const fs = require("fs").promises;
const { sh } = require("../scripts/sh");
const path = require("path");
const gradient = require("gradient-string");
const { logo } = require("../constants/logo.js");

const init = async (options) => {
  console.log(gradient.summer(logo));
  const configPath = options.config;

  // get the contents of the file first from configPath
  const configFile = await fs.readFile(configPath, "utf8");
  console.log("File fetched from: ", configFile);

  // write the file to appropriate path
  await fs.writeFile(
    path.join(__dirname, "../config.json"),
    configFile,
    "utf8"
  );
  console.log(
    "Config file written to: ",
    path.join(__dirname, "..", "config.json")
  );

  // bootstrap the required regions
  // - we want to bootstrap inside the aws folder
  const awsPath = path.resolve(__dirname, "..", "aws");
  console.log("AWS Path: ", awsPath);

  await sh(`(cd ${awsPath} && cdk bootstrap)`);
  console.log("Bootstrapped AWS regions");

  const s3StagingBucketCheck = require("../scripts/S3StagingBucketCheck.js");
  await s3StagingBucketCheck();
  console.log("Staging Bucket Check Complete");

  // install the orchestrator node_modules
  await sh(`(cd ${awsPath}/lambda/orchestrator && npm install)`);
  console.log("Installed orchestrator node_modules");

  // deploy the home infrastructure
  await sh(`(cd ${awsPath} && cdk deploy \"*Home*\")`);
  console.log("Deployed home infrastructure");

  // run the home initialization scripts (excluding the s3 upload)
  // these all have logs inside at the moment
  const initializeDynamoDB = require("../scripts/initializeDynamoDB.js");
  const initializeTimestreamDB = require("../scripts/initializeTimestreamDB.js");
  await initializeDynamoDB();
  await initializeTimestreamDB();
};

module.exports = init;
