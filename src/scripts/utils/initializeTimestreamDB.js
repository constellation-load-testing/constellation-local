const configParser = require("../configParser.js");
const regions = Object.keys(configParser.REMOTE_REGIONS);

// Create a new Timestream database
const { TimestreamWrite } = require("@aws-sdk/client-timestream-write");
const { CreateTableCommand } = require("@aws-sdk/client-timestream-write");

const createTimestreamDB = async () => {
  const timestreamWrite = new TimestreamWrite({ region: configParser.HOME_REGION });
  const params = {
    DatabaseName: "constellation-timestream-db",
  };
  try {
    regions.forEach(async (region) => {
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
      try {
        const createTestsResponse = await timestreamWrite.send(new CreateTableCommand(createTests));
        const createCallsResponse = await timestreamWrite.send(new CreateTableCommand(createCalls));
        console.log(createTestsResponse);
        console.log(createCallsResponse);
      } catch (err) {
        console.log("Error", err);
      }
    });
  } catch (err) {
    console.log("Error", err);
  }
};

module.exports = createTimestreamDB;
