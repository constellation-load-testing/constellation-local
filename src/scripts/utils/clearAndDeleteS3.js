const config = require("../../config.json")
const HOME_REGION = config.HOME_REGION;
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

const getBucketsByKeyword = async (keyword) => {
  try {
    const buckets = await s3.listBuckets().promise();
    const returnBuckets = buckets.Buckets.filter((bucket) => {
      return bucket.Name.includes(keyword);
    });

    return returnBuckets;
  } catch (e) {
    console.log(e);
  }
};

// clear s3 bucket
const clearBucket = async (bucket) => {
  try {
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

    console.log(`Success. S3 Objects from ${bucket.Name} cleared.`);
  } catch (err) {
    console.log("Error", err);
  }
};

// delete s3 bucket by name
const deleteBucket = async (bucket) => {
  const params = {
    Bucket: bucket.Name,
  };
  try {
    await s3.deleteBucket(params).promise();
    console.log(`Success. S3 bucket: ${bucket.Name} deleted.`);
  } catch (err) {
    console.log(`Error. Unable to delete bucket ${bucket.Name}:`, err);
  }
};

const run = async () => {
  try {
    // bucket name specific to (home) region
    const bucketName = `constellation`;    

    const buckets = await getBucketsByKeyword(bucketName);

    if (!buckets.length === 0) {
      console.log(`Note. No S3 bucket(s) with name including: ${bucketName} found`);
      return;
    }

    // in case multiple buckets with `constellation` keyword exists, they are all cleared and deleted
    for (let i = 0; i < buckets.length; i++) {
      const bucket = buckets[i];
      await clearBucket(bucket);
      await deleteBucket(bucket);
    }

  } catch (e) {
    console.log(e);
  }
};

module.exports = run;
