const AWS = require("aws-sdk");
const configParser = require("../configParser.js");

const {
  TimestreamWriteClient,
  ListTablesCommand,
  DeleteTableCommand,
	DeleteDatabaseCommand
} = require("@aws-sdk/client-timestream-write");

const timestreamWrite = new AWS.TimestreamWrite({
  region: configParser.HOME_REGION,
});

const timestreamWriteClient = new TimestreamWriteClient({
  region: configParser.HOME_REGION,
});

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
    let noOfTables = data.Tables;
    if (!noOfTables) {
      // if no tables in database
      console.log("No tables in database");
      return;
    }

    // tables found in database
    for (let i = 0; i < noOfTables.length; i++) {
      await timestreamWriteClient.send(
        new DeleteTableCommand({
          DatabaseName: databaseParams.DatabaseName, // database name
          TableName: noOfTables[i].TableName,
        })
      );
    }
    console.log("Success. Timestream Tables deleted.");
  } catch (err) {
    console.log("Error", err);
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
  } catch (e) {
    console.log(e);
  }
};

module.exports = run;
