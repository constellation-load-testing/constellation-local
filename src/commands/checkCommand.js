const gradient = require("gradient-string");
const validateConfigFile = require("../scripts/validateConfigFile");
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

const check = async (options) => {
  const { ora, chalk } = await require("./helpers/esmodules.js")();

  // LOG CONFIGS
  devLog(options);
  if (options.log) {
    process.env.LOG_LEVEL = "raw";
  }
  const isRaw = process.env.LOG_LEVEL === "raw" ? true : false;

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
  // Read & Write config file
  header.text = appendMsg("Config json file -🟠 Validating");
  const configPath = options.config;
  await readWriteConfigFile(configPath);
  devLog("config file fetched");

  const config = require("../config.json");
  devLog("config read");
  // Validate config file contents
  const { isValid: isConfigValid, message: configMsg } =
    validateConfigFile(config);

  if (!isConfigValid) {
    header.text = replaceMsg("Config json file -🔴 Invalid");
    header.text = appendMsg(`Message: ${configMsg}`);
    header.stopAndPersist({
      symbol: "❌ ",
    });
    // premature return @ config file validation fail - with msg
    devLog(`Config file failed validation, see message: ${configMsg}`);
    return;
  }
  devLog("config file validated, passed checks");

  // Extract regions from config file (unique)
  const ALL_REGIONS = Array.from(
    new Set(Object.keys(config.REMOTE_REGIONS).concat(config.HOME_REGION))
  );

  devLog("config file all regions extracted");

  header.text = replaceMsg("Config json file -🟢 Validated");
  // Fetch caller AWS account number
  const accountNumber = await getAWSAccountNumber();
  devLog("Default AWS account number fetched:", accountNumber);

  // Parallelize bootstrapping and isolate any failed regions
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
          message +
            " 🔴 Failed!, Please wait until all processes are completed",
          region
        );
        // push to failed regions collection
        failedRegions.push(region);
      });
  });

  // parallelized bootstrapping appears to work fine
  await Promise.allSettled(shellPromises);
  if (failedRegions.length === 0) {
    header.text = replaceMsg(
      "Bootstrapping All regions -🟢 Bootstrapped",
      "Boostrapping"
    );
    devLog("No regions failed bootstrapping 👍");
  } else {
    devLog("Regions which failed bootstrapping", failedRegions);
    const regions = failedRegions.join(", ");
    header.text = appendMsg(
      `Ended Prematurely, some regions failed bootstrapping. To amend this, complete the following steps (for ${regions}): \n✨    1. Delete the S3 staging bucket from the AWS console\n✨    2. Delete the CDKToolkit stack from the AWS CloudFormation console\n✨    3. Re-run the \`constellation check\` command to confirm`
    );
    header.stopAndPersist({
      symbol: "❌ ",
    });
    // premature return
    return;
  }

  // Perform cdk bucket check by region (regions are automatically discerned)
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
    const regions = failedS3Regions.join(", ");
    header.text = appendMsg(
      `Ended Prematurely, some regions have missing staging buckets. To amend this, complete the following steps (for ${regions}): \n✨    1. Delete the S3 staging bucket from the AWS console\n✨    2. Delete the CDKToolkit stack from the AWS CloudFormation console\n✨    3. Re-run the \`constellation check\` command to confirm`
    );
    header.stopAndPersist({
      symbol: "❌ ",
    });
  }

  // function end, returns true due to chained `init` command
  return true;
};

module.exports = check;
