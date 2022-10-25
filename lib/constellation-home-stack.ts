import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from 'constructs';

export class ConstellationHomeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    const vpc = new ec2.Vpc(this, "vpc-remote-constellation")

    // if the vpc above is not made, line below creates a separate vpc for the cluster
    const cluster = new ecs.Cluster(this, "cluster-constellation", {
      vpc: vpc
    })



  }
}
