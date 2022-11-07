const createS3AndUploadScript = require("./utils/createS3AndUploadScript.js");
const initializeDynamoDB = require("./utils/initializeDynamoDB.js");
const initializeTimestreamDB = require("./utils/initializeTimestreamDB.js");

const run = async () => {
  try {
    await createS3AndUploadScript();
    await initializeDynamoDB();
    await initializeTimestreamDB();
  } catch (e) {
    console.log(e);
  }
};

run();
