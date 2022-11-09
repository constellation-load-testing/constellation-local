const config = require("../config.json");
const regions = Object.keys(config.REMOTE_REGIONS);

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
    // console.log(createTableResponse);
  } catch (err) {
    if (err.name === "ThrottlingException") {
      console.log("ThrottlingException. Waiting 1 second and trying again.");
      await delayMs(1000);
      await tryTableCreation(params);
    } else {
      console.log("Error", err);
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
          MagneticStoreRetentionPeriodInDays: 7,
        },
      };
      const createCalls = {
        DatabaseName: "constellation-timestream-db",
        TableName: `${region}-calls`,
        RetentionProperties: {
          MemoryStoreRetentionPeriodInHours: 24,
          MagneticStoreRetentionPeriodInDays: 7,
        },
      };
      const createTestsResponse = await tryTableCreation(createTests);
      // console.log(createTestsResponse);
      console.log(`Success. Timestream Table: ${region}-tests created.`);
      delayMs(500);
      const createCallsResponse = await tryTableCreation(createCalls);
      // console.log(createCallsResponse);
      console.log(`Success. Timestream Table: ${region}-calls created.`);
      delayMs(500);
    }
  } catch (err) {
    console.log("Error", err);
  }
};

module.exports = createTimestreamDB;
