#!/usr/bin/env node
const cli = require("commander");
const gradient = require("gradient-string");
const { logo } = require("./constants/logo.js");
const check = require("./commands/checkCommand.js");
const init = require("./commands/initCommand.js");
const runTest = require("./commands/runTestCommand.js");
const teardownHome = require("./commands/teardownHomeCommand.js");
const teardownRemote = require("./commands/teardownRemoteCommand.js");
const teardownAll = require("./commands/teardownAllCommand");
const runVisualizer = require("./commands/runVisualizerCommand.js");

cli.description("Constellation API Load Testing CLI");
cli.name("constellation");

cli
  .command("check")
  .requiredOption("--config <path>", "Relative path to the config.json file")
  .option("--log", "Optional, logging of output, disables cli spinner")
  .description(
    "Runs preliminary checks for regions detected in user config file against default AWS CLI account. Ideal for first time usage or new remote region deployment."
  )
  .action(check);

cli
  .command("init")
  .requiredOption("--config <path>", "Relative path to the config.json file")
  .option("--log", "Optional, logging of output, disables cli spinner")
  .description(
    "Initialize the Constellation API Load Testing CLI according to user configuration"
  )
  .action(async (options) => {
    console.log(gradient.summer(logo));
    const isCheckSuccessful = await check(options);
    if (isCheckSuccessful) await init(options);
  });

cli
  .command("run-test")
  .requiredOption("--script <path>", "Relative path to the script.js file")
  .option("--log", "Optional, logging of output, disables cli spinner")
  .description(
    "Deploys remote infrastructure and runs the test script in a geographically distributed manner"
  )
  .action(runTest);

cli
  .command("teardown-home")
  .option("--log", "Optional, logging of output, disables cli spinner")
  .description("Tears down the home infrastructure")
  .action(teardownHome);

cli
  .command("teardown-remote")
  .option("--log", "Optional, logging of output, disables cli spinner, ")
  .description("Tears down the remote region(s) infrastructure")
  .action(teardownRemote);

cli
  .command("teardown-all")
  .option("--log", "Optional, logging of output, disables cli spinner")
  .description("Tearsdown all infrastructure")
  .action(teardownAll);

cli
  .command("run-visualizer")
  .description("Displays the Constellation visualizer at Port 3002")
  .action(runVisualizer);

cli.parse(process.argv);
