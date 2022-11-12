const {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} = require("@aws-sdk/client-dynamodb");

const HOME_REGION = process.env.HOME_REGION;
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
    // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html#Programming.Errors.ProvisionedThroughputExceededException
    // for handling throttling error: ProvisionedThroughputExceededException, wait for 250ms and retry
    if (e.name === "ProvisionedThroughputExceededException") {
      console.log("throttling error encountered, retrying putItem");
      await new Promise((resolve) => setTimeout(resolve, 250));
      return await readItem(id);
    } else {
      console.log(e);
    }
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
    // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html#Programming.Errors.ProvisionedThroughputExceededException
    // for handling throttling error: ProvisionedThroughputExceededException, wait for 250ms and retry
    if (e.name === "ProvisionedThroughputExceededException") {
      console.log("throttling error encountered, retrying putItem");
      await new Promise((resolve) => setTimeout(resolve, 250));
      return await putItem(id, data);
    } else {
      console.log(e);
    }
  }
};

module.exports = {
  readItem,
  putItem,
};
