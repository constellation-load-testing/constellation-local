const uploadScriptToS3 = require("./utils/uploadScriptToS3.js");
const storeRemoteRegions = require("./utils/storeRemoteRegions.js");

const run = async () => {
  try {
    await uploadScriptToS3();
    await storeRemoteRegions();
  } catch (e) {
    console.log(e);
  }
};

run();
