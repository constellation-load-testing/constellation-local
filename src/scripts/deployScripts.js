const uploadScriptToS3 = require("./utils/uploadScriptToS3.js");
const initializeDynamoDB = require("./utils/initializeDynamoDB.js");

const run = async () => {
  try {
    await uploadScriptToS3();
    await initializeDynamoDB();
  } catch (e) {
    console.log(e);
  }
};

run();
