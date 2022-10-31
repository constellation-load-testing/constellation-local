// this script will call on the orchestrator lambda and store the remote regions pursued by the user in to a database
const config = require("../../config.json");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const HOME_REGION = "us-west-2";
const DYNAMODB_TABLE_NAME = "constellation-dynamodb-table";

const client = new DynamoDBClient({
  region: HOME_REGION,
});

// write to dynamodb (new item)
const putItem = async (id, data) => {
  data = JSON.stringify(data);
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Item: {
      id: { S: id },
      data: { S: data },
    },
  };

  const command = new PutItemCommand(params);
  const response = await client.send(command);
  console.log(
    'Success. Remote regions recorded to DynamoDB under id: "required-remote-regions".'
  );
};

const run = async () => {
  const { remoteRegions } = config;
  await putItem("required-remote-regions", remoteRegions);
};

module.exports = run;
