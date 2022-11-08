#!/usr/bin/env node

const cli = require("commander");
const fs = require("fs").promises;
const path = require("path");

const { sh } = require("./scripts/utils/sh")

cli.description("Constellation API Load Testing CLI");
cli.name("constellation");

const init = async (options) => {
  const configPath = options.config;
  
  // get the contents of the file first from configPath
  const configFile = await fs.readFile(configPath, "utf8");
  console.log("File fetched from: ", configFile);
  
  // write the file to appropriate path
  await fs.writeFile(path.join(__dirname, "./config.json"), configFile, "utf8");
  console.log("Config file written to: ", path.join(__dirname, "./config.json"));
  
  // bootstrap the required regions
  // - we want to bootstrap inside the aws folder
  const awsPath = path.resolve(__dirname, "aws");
  console.log("AWS Path: ", awsPath);
  
  await sh(`(cd ${awsPath} && cdk bootstrap)`)
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
  const s3StagingBucketCheck = require("./scripts/utils/S3StagingBucketCheck.js");
  await s3StagingBucketCheck();
  console.log("Staging Bucket Check Complete");

  // install the orchestrator node_modules
  await sh(`(cd ${awsPath}/lambda/orchestrator && npm install)`)
  console.log("Installed orchestrator node_modules");
  
  // deploy the home infrastructure
  await sh(`(cd ${awsPath} && cdk deploy \"*Home*\")`)
  console.log("Deployed home infrastructure");
  
  // run the home initialization scripts (excluding the s3 upload)
  // these all have logs inside at the moment
  const initializeDynamoDB = require("./scripts/utils/initializeDynamoDB.js");
  const initializeTimestreamDB = require("./scripts/utils/initializeTimestreamDB.js");
  await initializeDynamoDB();
  await initializeTimestreamDB();
};

cli
  .command("init")
  .requiredOption("--config <path>", "Relative path to the config.json file")
  .description("Initialize the Constellation API Load Testing CLI")
  .action(init);

const runTest = async (options) => {
  const testPath = options.script;

  // get the contents of the file first from testPath
  const testFile = await fs.readFile(testPath, "utf8");
  console.log("File fetched from: ", testFile);

  // write the file to appropriate path
  await fs.writeFile(path.join(__dirname, "./script.js"), testFile, "utf8");
  console.log("Config file written to: ", path.join(__dirname, "./script.js"));

  // upload to s3
  const createS3AndUploadScript = require("./scripts/utils/createS3AndUploadScript.js");
  await createS3AndUploadScript();
  console.log("Uploaded script to S3");

  // Deploy remote regions (in parallel)
  const config = require("./config.json");
  const REMOTE_REGIONS = Object.keys(config.REMOTE_REGIONS) 
  const awsPath = path.resolve(__dirname, "aws");
  console.log("AWS Path: ", awsPath);


  const shellPromises = REMOTE_REGIONS.map(region => {
    const command = `(cd ${awsPath} && cdk deploy -f \"*${region}*\")`
    return sh(command)
      .then(() => {
        console.log(`Deployed ${region} infrastructure`);
      })
      .catch(err => {
        console.log(`Error deploying ${region} infrastructure`, err);
      })
  })
  
  await Promise.allSettled(shellPromises);
  console.log("Deployed remote regions");  

}

cli
  .command("run-test")
  .requiredOption("--script <path>", "Relative path to the script.js file")
  .description("Running the test script")
  .action(runTest);

const homeDestroy = async () => {
  // clean up home components before destroying
  const clearAndDeleteS3 = require("./scripts/utils/clearAndDeleteS3.js");
  const clearTimestream = require("./scripts/utils/clearTimestream.js");
  await clearAndDeleteS3();
  await clearTimestream();

  // destroy home infrastructure
  const awsPath = path.resolve(__dirname, "aws");
  console.log("AWS Path: ", awsPath);

  await sh(`(cd ${awsPath} && cdk destroy -f \"*Home*\")`);
  console.log("Destroyed home infrastructure");
}

cli
  .command("teardown-home")
  .description("Command tears down the home infrastructure")
  .action(homeDestroy);

const remoteDestroy = async () => {
  // Deploy remote regions (in parallel)
  const config = require("./config.json");
  const REMOTE_REGIONS = Object.keys(config.REMOTE_REGIONS) 
  const awsPath = path.resolve(__dirname, "aws");
  console.log("AWS Path: ", awsPath);


  const shellPromises = REMOTE_REGIONS.map(region => {
    const command = `(cd ${awsPath} && cdk destroy -f \"*${region}*\")`
    return sh(command)
      .then(() => {
        console.log(`Destroyed ${region} infrastructure`);
      })
      .catch(err => {
        console.log(`Error destroying ${region} infrastructure`, err);
      })
  })
  
  await Promise.allSettled(shellPromises);
  console.log("Destroyed remote regions");
}

cli
  .command("teardown-remote")
  .description("Destroys the remote region(s) infrastructure")
  .action(remoteDestroy);

cli
  .command("teardown-all")
  .description("Destroys all infrastructure")
  .action(async () => {
    await remoteDestroy();
    await homeDestroy();
    console.log("Destroyed all infrastructure");
  });

cli.parse(process.argv);

/*
Prior: 
- Tell user to create a config.json. README of source code will tell user how to format config.json

constellation init --config <path>/config.json
- What does this do?
  - Writes the config.json to the correct location (in /src)
  - Bootstraps the required regions
  - Deploys home infra
  - Runs home initialization (without script.js s3 upload)

constellation run-test --script <path>/script.js
- Whats does this do?
  - Writes the script.js file in to the correct location (/src)
  - Create s3 bucket (if needed) and uploads script.js to s3
  - Deploy remote regions (in parallel)
- Note: data is being streamed to timestream database - therefore can view information as needed (jake's visualizer)

constellation visualize
- What does this do?
  - Runs jake's visualization process

constellation teardown-home
- Whats does this do?
  - Run home cleanup scripts (clears s3 and timestream)
  - Destroys home region
  - Note: this also teardown timestream database - therefore, data disappears

constellation teardown-remote
- Whats does this do?
  - Parallel destruction of remote region(s)

constellation teardown-all
- What does this do?
  - Parallel destruction of remote region(s)
  - Runs home cleanup scripts
  - Destroys home region
  - Done.


*/