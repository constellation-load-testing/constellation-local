const configParser = require("./configParser.js");
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
      const params = {
        DatabaseName: "constellation-timestream-db",
        TableName: region,
        RetentionProperties: {
          MemoryStoreRetentionPeriodInHours: 24,
          MagneticStoreRetentionPeriodInDays: 7,
        },
      };
      try {
        const data = await timestreamWrite.send(new CreateTableCommand(params));
        console.log(data);
      } catch (err) {
        console.log("Error", err);
      }
    });
  } catch (err) {
    console.log("Error", err);
  }
};

module.exports = createTimestreamDB;
