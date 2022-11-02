const clearS3 = require("./utils/clearS3.js");
const clearTimestream = require("./utils/clearTimestream.js");

const run = async () => {
  try {
    await clearS3();
    await clearTimestream();
  } catch (e) {
    console.log(e);
  }
};

run();
