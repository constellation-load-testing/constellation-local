const clearAndDeleteS3 = require("./utils/clearAndDeleteS3.js");
const clearTimestream = require("./utils/clearTimestream.js");

const run = async () => {
  try {
    await clearAndDeleteS3();
    await clearTimestream();
  } catch (e) {
    console.log(e);
  }
};

run();
