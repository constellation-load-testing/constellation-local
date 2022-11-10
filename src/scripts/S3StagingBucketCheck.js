const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");
const {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
} = require("@aws-sdk/client-s3");
const stsClient = new STSClient({});

const config = require("../config.json");
const { devLog } = require("./loggers");

const ALL_REGIONS = Array.from(
  new Set(Object.keys(config.REMOTE_REGIONS).concat(config.HOME_REGION))
);

/**
 * This function will check if a specific S3 bucket exists in a specific region
 *
 * The issue here is that while the CDKToolkit stack is created in cloudformation, the staging bucket is not guaranteed to be created. A workaround is to:
 * 1. Check if the bucket is created
 * 2. Create the bucket if it is not created
 *
 * -- Requirements for bucket creation?
 *
 * -- -- Deploy the bucket on the correct region
 *
 * -- -- Match the staging bucket pattern
 *
 * -- -- cdk-hnb659fds-assets-625527221604-us-east-1
 *
 * -- -- cdk-XXXXXXXXX-assets-YYYYYYYYYYYY-ZZZZZZZZZ where X = hash(cdk version?), Y = account number, Z = region
 *
 * -- -- Constraint, X is a hash that is possibly a cdk version specific, thus must be hardcoded in! The hash has been seen as `hnb659fds` across different accounts in different regions.
 */
const s3StagingBucketCheck = async () => {
  const callerIdentity = await stsClient.send(new GetCallerIdentityCommand({}));
  const accountNumber = callerIdentity.Account;

  const cdkHash = "hnb659fds";

  for (const region of ALL_REGIONS) {
    const s3ClientOnRegion = new S3Client({ region });

    const output = await s3ClientOnRegion.send(new ListBucketsCommand({}));
    // based on bucket names, check if the bucket exists
    const bucketExists = output.Buckets.find((bucket) => {
      return (
        bucket.Name.includes("cdk") &&
        bucket.Name.includes("assets") &&
        bucket.Name.includes(accountNumber) &&
        bucket.Name.includes(region)
      );
    });

    if (bucketExists) {
      devLog(
        `Bootstrapping bucket exists in ${region}, no manual creation required`
      );
      continue;
    }

    // otherwise, manually create the bucket
    const createBucket = async (bucketName) => {
      const params = {
        Bucket: bucketName,
      };
      try {
        await s3ClientOnRegion.send(new CreateBucketCommand(params));
        devLog(`Bucket MANUALLY ${bucketName} created.`);
      } catch (err) {
        devLog(`Error creating bucket ${bucketName}:`, err);
      }
    };

    const bucketName = `cdk-${cdkHash}-assets-${accountNumber}-${region}`;
    await createBucket(bucketName);
  }
};

module.exports = s3StagingBucketCheck;
