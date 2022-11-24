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
    "Runs checks on config file and AWS default CLI account for desired environments"
  )
  .action(check);

cli
  .command("init")
  .requiredOption("--config <path>", "Relative path to the config.json file")
  .option("--log", "Optional, logging of output, disables cli spinner")
  .description("Initialize the Constellation API Load Testing CLI")
  .action(async (options) => {
    console.log(gradient.summer(logo));
    const isCheckSuccessful = await check(options);
    if (isCheckSuccessful) await init(options);
  });

cli
  .command("run-test")
  .requiredOption("--script <path>", "Relative path to the script.js file")
  .option("--log", "Optional, logging of output, disables cli spinner")
  .description("Running the test script")
  .action(runTest);

cli
  .command("teardown-home")
  .option("--log", "Optional, logging of output, disables cli spinner")
  .description("Command tears down the home infrastructure")
  .action(teardownHome);

cli
  .command("teardown-remote")
  .option("--log", "Optional, logging of output, disables cli spinner, ")
  .description("Destroys the remote region(s) infrastructure")
  .action(teardownRemote);

cli
  .command("teardown-all")
  .option("--log", "Optional, logging of output, disables cli spinner")
  .description("Destroys all infrastructure")
  .action(teardownAll);

cli
  .command("run-visualizer")
  .description("Runs the visualizer")
  .action(runVisualizer);

cli.parse(process.argv);
