const path = require("path");
const { sh } = require("../scripts/sh");
const { devLog } = require("../scripts/loggers");

const teardownHome = async (options) => {
  devLog(options);
  if (options.log) {
    process.env.LOG_LEVEL = "raw";
  }
  const isRaw = process.env.LOG_LEVEL === "raw" ? true : false;

  // clean up home components before destroying
  const clearAndDeleteS3 = require("../scripts/clearAndDeleteS3.js");
  const clearTimestream = require("../scripts/clearTimestream.js");
  await clearAndDeleteS3();
  await clearTimestream();

  // destroy home infrastructure
  const awsPath = path.resolve(__dirname, "..", "aws");
  devLog("AWS Path: ", awsPath);

  await sh(`(cd ${awsPath} && cdk destroy -f \"*Home*\")`, isRaw);
  devLog("Destroyed home infrastructure");
};

module.exports = teardownHome;
