const gradient = require("gradient-string");
const getAWSAccountNumber = require("../scripts/getAWSAccountNumber");
const readWriteConfigFile = require("../scripts/readWriteConfigFile");
const getRegionsWithoutCDKBucket = require("../scripts/getRegionsWithoutCDKBucket");
const { sh } = require("../scripts/sh");
const { devLog } = require("../scripts/loggers");
const { logo } = require("../constants/logo.js");
const {
  createOraInstance,
  initMsgManipulation,
} = require("./helpers/cliHelpers.js");

/**
 * The purpose of this command is to conduct preliminary checks on
 * ... the user made config file. Thus the task of this command needs to be:
 *   1. Fetch and write the config file to the correct location
 *     - this will be done again in the init-test command
 *   1.1. Get the regions out of the config file
 *   2. Fetch the default account number which is being used
 *     - (ref. S3StagingBucketCheck)
 *   3. Perform manual cdk commands - at isolated processes:
 *     - see: https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html#:~:text=Bootstrapping%20with%20the%20AWS%20CDK%20Toolkit
 *     - see: via `cdk bootstrap ${accountNumber}/${region}`
 *   3.1. If any regions fail, show message
 *   4. Perform cdk bucket existence check
 *   4.1 Do NOT create bucket for user but only inform that this will be an issue
 *   5. Pass on message to user about next steps and run check again
 */
const check = async (options) => {
  const { ora, chalk } = await require("./helpers/esmodules.js")();

  // LOG CONFIGS
  devLog(options);
  if (options.log) {
    process.env.LOG_LEVEL = "raw";
  }
  const isRaw = process.env.LOG_LEVEL === "raw" ? true : false;

  console.log(gradient.summer(logo));

  // ORA;
  const header = createOraInstance(ora, {
    text: chalk
      .hex("#f7a11b")
      .bold("Checking Constellation Regions for deployment..."),
    spinner: "earth",
  }).start();

  const { appendMsg, replaceMsg } = initMsgManipulation(
    chalk.hex("#fddb45"),
    header
  );

  // MESSAGES & PROCESSES
  // Task 1: - read & write config file to correct location
  header.text = appendMsg("Config json file -🟠 Validating");
  const configPath = options.config;
  await readWriteConfigFile(configPath);
  devLog("config file fetched");

  // Task 1.1: - extract regions from said config file, ensures unique (if a home region is coincidentally a remote region as well)
  const config = require("../config.json");
  const ALL_REGIONS = Array.from(
    new Set(Object.keys(config.REMOTE_REGIONS).concat(config.HOME_REGION))
  );
  devLog("config file read and all regions extracted");
  header.text = replaceMsg("Config json file -🟢 Validated");

  // Task 2: get default account number which CDK is being used
  const accountNumber = await getAWSAccountNumber();
  devLog("Default AWS account number fetched:", accountNumber);

  // Task 3: Create commands for bootstrapping and isolate to child processes
  //         + store failed regions
  header.text = appendMsg("Bootstrapping All regions -🟠 Boostrapping");
  devLog("Bootstrapping regions according to:", ALL_REGIONS);
  const failedRegions = [];
  const shellPromises = ALL_REGIONS.map((region) => {
    const command = `cdk bootstrap ${accountNumber}/${region}`;
    const whiteSpaceCount = 15 - region.length;
    const message = ":: " + region + " ".repeat(whiteSpaceCount) + "-";
    header.text = appendMsg(message + " ⏳");

    devLog("executing command:", command);
    return sh(command, isRaw)
      .then(() => {
        devLog("region:", region, "has been bootstrapped");
        header.text = replaceMsg(message + " 🛠️", region);
      })
      .catch(() => {
        devLog("region:", region, "failed in bootstrapping phase!");
        header.text = replaceMsg(
          message + " 🔴 Failed!, Please wait till all processes are completed",
          region
        );
        // push to failed regions collection
        failedRegions.push(region);
      });
  });

  // see if parallelized promises break bootstrapping
  await Promise.allSettled(shellPromises);
  if (failedRegions.length === 0) {
    header.text = replaceMsg(
      "Bootstrapping All regions -🟢 Bootstrapped",
      "Boostrapping"
    );
    devLog("No regions failed bootstrapping 👍");
  } else {
    devLog("Regions which failed bootstrapping", failedRegions);
    const regions = failedRegions.reduce(
      (acm, region) => acm + " " + region,
      ""
    );
    header.text = appendMsg(
      `Ended Prematurely, some regions failed bootstrapping... 😔, ${regions}. To amend this, complete the following steps: \n✨    1. Delete the S3 staging bucket\n✨    2. Delete the CDKToolkit stack from the AWS CloudFormation console\n✨    3. Re-run the \`constellation check\` command to confirm`
    );
    header.stopAndPersist({
      symbol: "❌ ",
    });
    // premature return
    return;
  }

  // 4. Perform cdk bucket check by region (regions are automatically discerned)
  header.text = appendMsg("Checking for Staging Buckets -🟠 Checking");
  const failedS3Regions = await getRegionsWithoutCDKBucket(ALL_REGIONS);

  if (failedS3Regions.length === 0) {
    header.text = replaceMsg(
      "Checking for Staging Buckets -🟢 Checked",
      "Checking"
    );
    header.text = appendMsg(
      "Completed Checking, ready to run initialization... 📜"
    );
    header.stopAndPersist({
      symbol: "✅ ",
    });
  } else {
    devLog(
      "Regions which passed bootstrapping but had missing staging buckets:",
      failedS3Regions
    );
    header.text = replaceMsg(
      "Checking for Staging Buckets -🔴 Failed",
      "Checking"
    );
    const regions = failedS3Regions.reduce(
      (acm, region) => acm + " " + region,
      ""
    );
    header.text = appendMsg(
      `The following regions have missing staging buckets... ☕: ${regions}. To amend this, complete the following steps: \n✨    1. Delete the S3 staging bucket\n✨    2. Delete the CDKToolkit stack from the AWS CloudFormation console\n✨    3. Re-run the \`constellation check\` command to confirm`
    );
    header.stopAndPersist({
      symbol: "❌ ",
    });
  }
};

module.exports = check;
