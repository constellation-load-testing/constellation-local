#!/usr/bin/env node

const cli = require("commander");
const fs = require("fs").promises;
const path = require("path");
const initializeDynamoDB = require("./scripts/utils/initializeDynamoDB.js");
const initializeTimestreamDB = require("./scripts/utils/initializeTimestreamDB.js");

const { sh } = require("./scripts/utils/sh")

cli.description("Constellation API Load Testing CLI");
cli.name("constellation");

const init = async (options) => {
  const configPath = options.config;
  console.log(configPath);

  // get the contents of the file first from configPath
  const configFile = await fs.readFile(configPath, "utf8");
  console.log("File fetched from: ", configFile);

  // then re-write the file to appropriate path
  await fs.writeFile(path.join(__dirname, "./config.json"), configFile, "utf8");
  console.log("Config file written to: ", path.join(__dirname, "./config.json"));

  // then bootstraps the required regions
  // - we want to bootstrap inside the aws folder
  const awsPath = path.resolve(__dirname, "aws");
  console.log("AWS Path: ", awsPath);

  await sh(`(cd ${awsPath} && cdk bootstrap)`)
  console.log("Bootstrapped AWS regions");

  // install the orchestrator node_modules
  await sh(`(cd ${awsPath}/lambda/orchestrator && npm install)`)
  console.log("Installed orchestrator node_modules");

  // then deploys the home infrastructure
  await sh(`(cd ${awsPath} && cdk deploy \"*Home*\")`)
  console.log("Deployed home infrastructure");

  // then runs the home initialization scripts (excluding the s3 upload)
  // these all have logs inside at the moment
  await initializeDynamoDB()
  await initializeTimestreamDB()

};

cli
  .command("init")
  .requiredOption("--config <path>", "Relative path to the config.json file")
  .description("Initialize the Constellation API Load Testing CLI")
  .action(init);

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

// node ./src/index.js
