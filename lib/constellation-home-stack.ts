import { Stack, StackProps } from 'aws-cdk-lib';
import { aws_timestream as timestream, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from 'constructs';

export class ConstellationHomeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // time stream database here
    const constellationTimestreamDB = new timestream.CfnDatabase(this, "constellation-timestream-db", {
      databaseName: 'sample-database'
    })

    // constellationTimestreamDB.applyRemovalPolicy(RemovalPolicy.RETAIN);
  }
}
