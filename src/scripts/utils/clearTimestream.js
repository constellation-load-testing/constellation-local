const AWS = require("aws-sdk");
const config = require("../../config.json");

const {
  TimestreamWriteClient,
  ListTablesCommand,
  DeleteTableCommand,
	DeleteDatabaseCommand
} = require("@aws-sdk/client-timestream-write");

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
    console.log(e);
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
      console.log("Note. No tables in database");
      return;
    } else if (tablesArr.length === 0) {
      // database exists but there are no tables anymore
      console.log("Success. No more tables in Timestream database");
      return;
    }

    // tables found in database
    for (let i = 0; i < tablesArr.length; i++) {
      console.log("Attempting to delete table: ", tablesArr[i].TableName);
      await timestreamWriteClient.send(
        new DeleteTableCommand({
          DatabaseName: databaseParams.DatabaseName, // database name
          TableName: tablesArr[i].TableName,
        })
      );
    }

    // check if tables are deleted - via recursion
    // - base case is `if (!tablesArr)`, ie: eventually no tables in db
    console.log("Note. Recursion to check if tables are deleted...");
    clearDatabase(DatabaseName);

  } catch (err) {
    if (err.name === "ThrottlingException") {
      console.log("ThrottlingException. Waiting 1 second and trying again.");
      await delayMs(1000);
      await clearDatabase(DatabaseName);
    } else {
      console.log("Error", err);
    }    
  }
};

const run = async () => {
  try {
		const database = await getDatabase("constellation");
    if (!database) {
      console.log("No timestream database found");
      return;
    }
    await clearDatabase(database.DatabaseName);
		await timestreamWriteClient.send(new DeleteDatabaseCommand({ DatabaseName: database.DatabaseName }));
  } catch (err) {
    console.log(err);
  }
};

module.exports = run;
