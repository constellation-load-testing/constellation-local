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
  .command("init")
  .requiredOption("--config <path>", "Relative path to the config.json file")
  .option("--log [type]", "Optional, level of log output. Use: dev, raw")
  .description("Initialize the Constellation API Load Testing CLI")
  .action(init);

cli
  .command("run-test")
  .requiredOption("--script <path>", "Relative path to the script.js file")
  .option("--log [type]", "Optional, level of log output. Use: dev, raw")
  .description("Running the test script")
  .action(runTest);

cli
  .command("teardown-home")
  .option("--log [type]", "Optional, level of log output. Use: dev, raw")
  .description("Command tears down the home infrastructure")
  .action(teardownHome);

cli
  .command("teardown-remote")
  .option("--log [type]", "Optional, level of log output. Use: dev, raw, ")
  .description("Destroys the remote region(s) infrastructure")
  .action(teardownRemote);

cli
  .command("teardown-all")
  .option("--log [type]", "Optional, level of log output. Use: dev, raw")
  .description("Destroys all infrastructure")
  .action(teardownAll);

cli.parse(process.argv);
