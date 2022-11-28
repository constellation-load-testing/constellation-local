const config = require("../config.json");
const regions = Object.keys(config.REMOTE_REGIONS);
const { devLog } = require("./loggers");

// Create a new Timestream database
const { TimestreamWrite } = require("@aws-sdk/client-timestream-write");
const { CreateTableCommand } = require("@aws-sdk/client-timestream-write");

const timestreamWrite = new TimestreamWrite({
  region: config.HOME_REGION,
});

const delayMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const tryTableCreation = async (params) => {
  try {
    const createTableResponse = await timestreamWrite.send(
      new CreateTableCommand(params)
    );
    // devLog(createTableResponse);
  } catch (err) {
    if (err.name === "ThrottlingException") {
      devLog("ThrottlingException. Waiting 1 second and trying again.");
      await delayMs(1000);
      await tryTableCreation(params);
    } else {
      devLog("Error", err);
    }
  }
};

const createTimestreamDB = async () => {
  try {
    // for with await delays the for loop. Added delayMs to further avoid throttling
    //   but will result in longer deployment time
    for (let i = 0; i < regions.length; i++) {
      let region = regions[i];
      const createTests = {
        DatabaseName: "constellation-timestream-db",
        TableName: `${region}-tests`,
        RetentionProperties: {
          MemoryStoreRetentionPeriodInHours: 24,
          MagneticStoreRetentionPeriodInDays: 365,
        },
      };
      const createCalls = {
        DatabaseName: "constellation-timestream-db",
        TableName: `${region}-calls`,
        RetentionProperties: {
          MemoryStoreRetentionPeriodInHours: 24,
          MagneticStoreRetentionPeriodInDays: 365,
        },
      };
      const createTestsResponse = await tryTableCreation(createTests);
      // devLog(createTestsResponse);
      devLog(`Success. Timestream Table: ${region}-tests created.`);
      delayMs(500);
      const createCallsResponse = await tryTableCreation(createCalls);
      // devLog(createCallsResponse);
      devLog(`Success. Timestream Table: ${region}-calls created.`);
      delayMs(500);
    }
  } catch (err) {
    devLog("Error", err);
  }
};

module.exports = createTimestreamDB;
