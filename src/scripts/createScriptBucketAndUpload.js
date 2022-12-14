const AWS = require("aws-sdk");
const path = require("path");
const fs = require("fs").promises;
const { devLog } = require("./loggers");
const config = require("../config.json");

const s3 = new AWS.S3({
  region: config.HOME_REGION,
});

// create s3 bucket
const createBucket = async (bucketName) => {
  const params = {
    Bucket: bucketName,
  };
  try {
    await s3.createBucket(params).promise();
    devLog(`Bucket ${bucketName} created.`);
  } catch (err) {
    devLog(`Error creating bucket ${bucketName}:`, err);
  }
};

const getBucket = async (keyword) => {
  try {
    const buckets = await s3.listBuckets().promise();
    const bucket = buckets.Buckets.find((bucket) => {
      return bucket.Name.includes(keyword);
    });

    return bucket;
  } catch (e) {
    devLog(e);
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
    devLog({
      message: "Unable to get from bucket",
      error: e,
    });
  }
};

const putToBucket = async (params) => {
  try {
    const response = await s3.putObject(params).promise();
  } catch (e) {
    devLog({
      message: "Unable to upload to bucket",
      error: e,
    });
  }
};

const createAndGetBucket = async (bucketName) => {
  try {
    // bucket name specific to region

    // create bucket
    await createBucket(bucketName);
    // after creating bucket, put a delay to allow bucket to be registered in AWS
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const bucket = await getBucket(bucketName);

    if (bucket) {
      devLog("Bucket named", bucketName, "confirmed created");
      return bucket;
    } else {
      devLog(
        "Bucket named",
        bucketName,
        "not found, attempting to create - again"
      );
      return await createAndGetBucket();
    }
  } catch (e) {
    devLog(e);
  }
};

const run = async () => {
  try {
    // check if CDK was able to create 'constellation' bucket first
    let bucket = await getBucket("constellation");

    if (!bucket) {
      devLog(
        "Warning. Bucket with 'constellation' keyword not found, attempting to create a placeholder bucket"
      );
      // bucket name specific to (home) region
      const bucketName = `constellation-s3-bucket-${config.HOME_REGION}`;

      // create and get a new bucket
      // - note that this bucket name does not have the account number on the constellation-s3-bucket suffix
      // - thus in danger of being non-unique across multiple users, thus only used if CDK failed to create 'constellation' bucket
      bucket = await createAndGetBucket(bucketName);
    } else {
      devLog(
        "Success. Bucket with 'constellation' keyword found, confirmed created by CDK"
      );
    }

    const bucketParams = {
      Bucket: bucket.Name,
      Key: "script.js",
    };

    // consider adding a fs here
    const file = await fs.readFile(
      path.join(__dirname, "..", "script.js"),
      "utf8"
    ); // <-- hard coded location
    bucketParams.Body = file;

    await putToBucket(bucketParams);
    const response = await getFromBucket(bucketParams);
    devLog("Success. Script uploaded to S3 bucket:", { response });
  } catch (e) {
    devLog(e);
  }
};

module.exports = run;
