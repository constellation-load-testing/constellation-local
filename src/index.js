#!/usr/bin/env node

const cli = require("commander");
const init = require("./commands/initCommand.js");
const runTest = require("./commands/runTestCommand.js");
const teardownHome = require("./commands/teardownHomeCommand.js");
const teardownRemote = require("./commands/teardownRemoteCommand.js");
const teardownAll = require("./commands/teardownAllCommand");

cli.description("Constellation API Load Testing CLI");
cli.name("constellation");

cli
  .command("tmp")
  .option("--log", "test")
  .action((options) => {
    console.log(options, typeof options.log);
  });

cli
  .command("init")
  .requiredOption("--config <path>", "Relative path to the config.json file")
  .option("--log", "Optional, logging of output, disables cli spinner")
  .description("Initialize the Constellation API Load Testing CLI")
  .action(init);

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

cli.parse(process.argv);
