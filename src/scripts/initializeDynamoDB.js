/**
 * This script initializes the DynamoDB table with the required schema
 * - active-regions (empty [] to start)
 * - completed-regions (empty [] to start)
 * - required-remote-regions (from config)
 */
const config = require("../config.json");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { devLog } = require("./loggers");

const HOME_REGION = config.HOME_REGION;
const DYNAMODB_TABLE_NAME = "constellation-dynamodb-table";

const client = new DynamoDBClient({
  region: HOME_REGION,
});

/**
 * This function writes to the DynamoDB table
 * @param {string} id
 * @param {string[]} validRegions
 */
const putItem = async (id, data) => {
  try {
    // convert data to string regardless of type
    const type = typeof data;
    if (type === "object") {
      data = JSON.stringify(data);
    } else if (type === "number") {
      data = data.toString();
    } // else, `data` already a string

    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Item: {
        id: { S: id },
        data: { S: data },
      },
    };

    const command = new PutItemCommand(params);
    await client.send(command);
  } catch (e) {
    devLog(e);
  }
};

const run = async () => {
  try {
    const remoteRegions = Object.keys(config.REMOTE_REGIONS);
    await putItem("aggregator-ready-regions", []);
    await putItem("test-completed-regions", []);
    await putItem("required-remote-regions", remoteRegions);
    await putItem("test-start-state", {
      state: false,
      timestamp: "",
    });
    devLog("Success. Initialized Dynamodb Schema and recorded remote regions.");
  } catch (e) {
    devLog(e);
  }
};

module.exports = run;
