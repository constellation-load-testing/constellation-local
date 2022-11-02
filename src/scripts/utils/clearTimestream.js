const AWS = require("aws-sdk");
const {
  TimestreamWriteClient,
  ListTablesCommand,
  DeleteTableCommand,
	DeleteDatabaseCommand
} = require("@aws-sdk/client-timestream-write");

const timestreamWrite = new AWS.TimestreamWrite({
  region: "us-east-1",
});

const timestreamWriteClient = new TimestreamWriteClient({
  region: "us-east-1",
});

// clear timestream database
const clearDatabase = async () => {
  try {
		const databaseParams = { DatabaseName: "constellation-timestream-db" };
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
    await clearDatabase();
		await timestreamWriteClient.send(new DeleteDatabaseCommand({ DatabaseName: "constellation-timestream-db" }))
  } catch (e) {
    console.log(e);
  }
};

module.exports = run;
