const path = require("path");
const { sh } = require("../scripts/utils/sh");

const teardownHome = async () => {
  // clean up home components before destroying
  const clearAndDeleteS3 = require("../scripts/utils/clearAndDeleteS3.js");
  const clearTimestream = require("../scripts/utils/clearTimestream.js");
  await clearAndDeleteS3();
  await clearTimestream();

  // destroy home infrastructure
  const awsPath = path.resolve(__dirname, "..", "aws");
  console.log("AWS Path: ", awsPath);

  await sh(`(cd ${awsPath} && cdk destroy -f \"*Home*\")`);
  console.log("Destroyed home infrastructure");
};

module.exports = teardownHome;
