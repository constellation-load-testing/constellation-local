import { Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { aws_timestream as timestream, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from 'constructs';

export class ConstellationHomeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // create a timestream database
    const constellationTimestreamDB = new timestream.CfnDatabase(this, "constellation-timestream-db", {
      databaseName: "sample-database",
      tags: [
        {
          key: "Name",
          value: "sample-database",
        },
      ],
    });

    // resource policy for the database - removal upon cdk destroy
    constellationTimestreamDB.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // create an s3 bucket
    const constellationS3Bucket = new s3.Bucket(this, "constellation-s3-bucket", {
      bucketName: `constellation-s3-bucket-${this.account}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

  }
}
