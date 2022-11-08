const fs = require("fs").promises;
const { sh } = require("../scripts/utils/sh");
const path = require("path");

const init = async (options) => {
  const configPath = options.config;

  // get the contents of the file first from configPath
  const configFile = await fs.readFile(configPath, "utf8");
  console.log("File fetched from: ", configFile);

  // write the file to appropriate path
  await fs.writeFile(path.join(__dirname, "../config.json"), configFile, "utf8");
  console.log(
    "Config file written to: ",
    path.join(__dirname, "..", "config.json")
  );

  // bootstrap the required regions
  // - we want to bootstrap inside the aws folder
  const awsPath = path.resolve(__dirname, ".." ,"aws");
  console.log("AWS Path: ", awsPath);

  await sh(`(cd ${awsPath} && cdk bootstrap)`);
  console.log("Bootstrapped AWS regions");

  // The issue here is that while the CDKToolkit stack is created in cloudformation, the staging bucket is not guaranteed to be created. A workaround is to:
  // 1. Check if the bucket is created
  // 2. Create the bucket if it is not created
  // -- Requirements for bucket creation?
  // -- -- Deploy the bucket on the correct region
  // -- -- Match the staging bucket pattern
  // -- -- cdk-hnb659fds-assets-625527221604-us-east-1
  // -- -- cdk-XXXXXXXXX-assets-YYYYYYYYYYYY-ZZZZZZZZZ where X = hash(cdk version?), Y = account number, Z = region
  // -- -- Constraint, X is a hash that is possibly a cdk version specific, thus must be hardcoded in! The hash has been seen as `hnb659fds` across different accounts in different regions.
  // Hopefully, this will circumnavigate the S3 specific errors
  const s3StagingBucketCheck = require("../scripts/utils/S3StagingBucketCheck.js");
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
  const initializeDynamoDB = require("../scripts/utils/initializeDynamoDB.js");
  const initializeTimestreamDB = require("../scripts/utils/initializeTimestreamDB.js");
  await initializeDynamoDB();
  await initializeTimestreamDB();
};

module.exports = init;