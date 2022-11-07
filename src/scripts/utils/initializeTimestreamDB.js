const configParser = require("../configParser.js");
const regions = Object.keys(configParser.REMOTE_REGIONS);

// Create a new Timestream database
const { TimestreamWrite } = require("@aws-sdk/client-timestream-write");
const { CreateTableCommand } = require("@aws-sdk/client-timestream-write");

const delayMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createTimestreamDB = async () => {
  const timestreamWrite = new TimestreamWrite({ region: configParser.HOME_REGION });
  try {
    // for with await delays the for loop. Added delayMs to further avoid throttling
    //   but will result in longer deployment time
    for (let i=0; i<regions.length; i++) {
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
      const createTestsResponse = await timestreamWrite.send(new CreateTableCommand(createTests));
      // console.log(createTestsResponse);
      console.log(`Success. Timestream Table: ${region}-tests created.`);
      delayMs(500)
      const createCallsResponse = await timestreamWrite.send(new CreateTableCommand(createCalls));
      // console.log(createCallsResponse);      
      console.log(`Success. Timestream Table: ${region}-calls created.`);
      delayMs(500)
    }
  } catch (err) {
    console.log("Error", err);
  }
};

module.exports = createTimestreamDB;
