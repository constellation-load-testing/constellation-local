const {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
} = require("@aws-sdk/client-s3");

const { devLog } = require("./loggers");

const getRegionsWithoutCDKBucket = async (regions) => {
  const failedRegions = [];
  for (const region of regions) {
    const s3ClientOnRegion = new S3Client({ region });

    const output = await s3ClientOnRegion.send(new ListBucketsCommand({}));
    // based on bucket names, check if the bucket exists
    const bucketExists = output.Buckets.find((bucket) => {
      return (
        bucket.Name.includes("cdk") &&
        bucket.Name.includes("assets") &&
        bucket.Name.includes(region)
      );
    });

    if (bucketExists) {
      devLog(`Staging bucket exists in ${region}`);
    } else {
      devLog(`Staging bucket missing in ${region}`);
      failedRegions.push(region);
    }
  }

  return failedRegions;
};

module.exports = getRegionsWithoutCDKBucket;
