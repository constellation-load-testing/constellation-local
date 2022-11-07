#!/usr/bin/env node

const cli = require("commander");
const fs = require("fs").promises;
const path = require("path");

cli.description("Constellation API Load Testing CLI");
cli.name("constellation");

const fn = async (options) => {
  const configPath = options.config;
  console.log(configPath);

  // get the contents of the file first from configPath
  const configFile = await fs.readFile(configPath, "utf8");

  // then re-write the file to appropriate path
  await fs.writeFile(path.join(__dirname, "./config.json"), configFile, "utf8");

  console.log("hello!");
  console.log(options);
  // this is where fs write file is going to be given the path.
};

/*
Prior: 
- Tell user to create a config.json. README of source code will tell user how to format config.json

constellation init --config <path>/config.json
- What does this do?
  - Writes the config.json to the correct location (in /src)
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

cli
  .command("init")
  .requiredOption("--config <path>", "Relative path to the config.json file")
  .description("Run the test script concurrently this number of times.")
  .action(fn);

cli.parse(process.argv);

// node ./src/index.js
