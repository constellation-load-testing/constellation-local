const AWS = require("aws-sdk");
const path = require("path");
const fs = require("fs").promises;
const configParser = require("../configParser.js");

const s3 = new AWS.S3({
  region: configParser.HOME_REGION,
});

const getBucket = async (keyword) => {
  try {
    const buckets = await s3.listBuckets().promise();
    const bucket = buckets.Buckets.find((bucket) => {
      return bucket.Name.includes(keyword);
    });

    return bucket;
  } catch (e) {
    console.log(e);
  }
};

const getFromBucket = async (params) => {
  try {
    const response = await s3
      .getObject({
        Bucket: params.Bucket,
        Key: params.Key,
      })
      .promise();

    return response.Body.toString(); // buffer to string
  } catch (e) {
    console.log({
      message: "Unable to get from bucket",
      error: e,
    });
  }
};

const putToBucket = async (params) => {
  try {
    const response = await s3.putObject(params).promise();
  } catch (e) {
    console.log({
      message: "Unable to upload to bucket",
      error: e,
    });
  }
};

const run = async () => {
  try {
    const bucket = await getBucket("constellation");

    const bucketParams = {
      Bucket: bucket.Name,
      Key: "script.js",
    };

    // consider adding a fs here
    const file = await fs.readFile(
      path.join(__dirname, "..", "..", "script.js"),
      "utf8"
    ); // <-- hard coded location
    bucketParams.Body = file;

    await putToBucket(bucketParams);
    const response = await getFromBucket(bucketParams);
    console.log({ response });
  } catch (e) {
    console.log(e);
  }
};

module.exports = run;
