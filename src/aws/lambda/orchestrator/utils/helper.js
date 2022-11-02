const {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} = require("@aws-sdk/client-dynamodb");

const HOME_REGION = "us-west-2";
const DYNAMODB_TABLE_NAME = "constellation-dynamodb-table";

const client = new DynamoDBClient({
  region: HOME_REGION,
});

// read from dynamodb
const readItem = async (id) => {
  try {
    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        id: { S: id },
      },
    };

    const command = new GetItemCommand(params);
    const { Item } = await client.send(command);
    /* note: shape
    { Item: { id: { S: 'aggregator-ready-regions' }, data: { S: '...' } } } 
    */
    return Item.data.S;
  } catch (e) {
    console.log(e);
  }
};

// update dynamodb
const putItem = async (id, data) => {
  try {
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
    console.log(e);
  }
};

module.exports = {
  readItem,
  putItem,
};
