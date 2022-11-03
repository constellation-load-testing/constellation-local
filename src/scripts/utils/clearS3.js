const configParser = require("./configParser.js");
const HOME_REGION = configParser.HOME_REGION;
const AWS = require("aws-sdk");
const {
  S3Client,
  ListObjectsCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const s3 = new AWS.S3({
  region: HOME_REGION,
});

const s3Client = new S3Client({
  region: HOME_REGION,
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

// clear s3 bucket
const clearBucket = async (bucket) => {
  try {
    if (!bucket) {
      console.log("No S3 bucket found");
      return;
    }

    const bucketParams = { Bucket: bucket.Name };
    const data = await s3Client.send(new ListObjectsCommand(bucketParams));
    let noOfObjects = data.Contents;
    if (!noOfObjects) {
      // if no objects in bucket
      console.log("No objects in bucket");
      return;
    }

    // objects found in bucket
    for (let i = 0; i < noOfObjects.length; i++) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketParams.Bucket, // bucket name
          Key: noOfObjects[i].Key,
        })
      );
    }

    console.log("Success. S3 Objects deleted.");
  } catch (err) {
    console.log("Error", err);
  }
};

const run = async () => {
  try {
    const bucket = await getBucket("constellation");
    await clearBucket(bucket);
  } catch (e) {
    console.log(e);
  }
};

module.exports = run;
