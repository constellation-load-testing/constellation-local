const AWS = require("aws-sdk");
const {
  TimestreamWriteClient,
  ListTablesCommand,
  DeleteTableCommand,
  DeleteDatabaseCommand,
} = require("@aws-sdk/client-timestream-write");

const config = require("../config.json");
const { devLog } = require("./loggers");

const timestreamWrite = new AWS.TimestreamWrite({
  region: config.HOME_REGION,
});

const timestreamWriteClient = new TimestreamWriteClient({
  region: config.HOME_REGION,
});

const delayMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getDatabase = async (keyword) => {
  try {
    const databases = await timestreamWrite.listDatabases().promise();
    const database = databases.Databases.find((database) => {
      return database.DatabaseName.includes(keyword);
    });
    return database;
  } catch (e) {
    devLog(e);
  }
};

// clear timestream database
const clearDatabase = async (DatabaseName) => {
  try {
    const databaseParams = { DatabaseName };
    const data = await timestreamWriteClient.send(
      new ListTablesCommand(databaseParams)
    );
    let tablesArr = data.Tables;
    if (!tablesArr) {
      // if no tables in database
      devLog("Note. No tables in database");
      return;
    } else if (tablesArr.length === 0) {
      // database exists but there are no tables anymore
      devLog("Success. No more tables in Timestream database");
      return;
    }

    // tables found in database
    for (let i = 0; i < tablesArr.length; i++) {
      devLog("Attempting to delete table: ", tablesArr[i].TableName);
      await timestreamWriteClient.send(
        new DeleteTableCommand({
          DatabaseName: databaseParams.DatabaseName, // database name
          TableName: tablesArr[i].TableName,
        })
      );
    }

    // check if tables are deleted - via recursion
    // - base case is `if (!tablesArr)`, ie: eventually no tables in db
    devLog("Note. Recursion to check if tables are deleted...");
    clearDatabase(DatabaseName);
  } catch (err) {
    if (err.name === "ThrottlingException") {
      devLog("ThrottlingException. Waiting 1 second and trying again.");
      await delayMs(1000);
      await clearDatabase(DatabaseName);
    } else {
      devLog("Error", err);
    }
  }
};

const run = async () => {
  try {
    const database = await getDatabase("constellation");
    if (!database) {
      devLog("No timestream database found");
      return;
    }
    await clearDatabase(database.DatabaseName);
    await timestreamWriteClient.send(
      new DeleteDatabaseCommand({ DatabaseName: database.DatabaseName })
    );
  } catch (err) {
    devLog(err);
  }
};

module.exports = run;
